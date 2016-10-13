/**
 * Scheme constructor.
 * @param {string} schemeID - ID of <canvas> element.
 * @param {string} listID - ID of parts list <ul> element.
 * @param {string} src - Image of scheme URL.
 * @param {string} labelsJSON - JSON array of labels with coordinates.
 * @param {object} params - Different styles configuration.
 * @constructor
 */
var Scheme = function (schemeID, listID, src, labelsJSON, params) {
    var canvas,                     // Canvas element
        list,                       // List element
        ctx,                        // Drawing context on the canvas
        labels,                     // Array of labels with coordinates
        schemeImg,                  // Image of scheme
        areas = [],                 // Array of clickable areas around the labels
        selectedAreas = [],         // Array of selected areas
        hoveredArea = {},           // Last hovered area
        config = {                  // ** Default configurations **
            padding: 30,            // padding around scheme image
            bgColor: '#fff',        // background color of scheme
            fontFamily: 'Arial',    // font family of the labels
            fontSize: '12px',       // font size of the labels
            fontColor: '#555555',   // font color of the labels
            areaRadius: 10,         // radius of area around selected items
            areaColor: '#a52a2a',   // color of area around selected items
            scale: 1                // scale of the scheme
        };

    /**
     * Area around label.
     * @param name
     * @param x
     * @param y
     * @param radius
     * @constructor
     */
    var Area = function (name, x, y, radius) {
        this.name = name;
        this.left = x - radius;
        this.top = y - radius;
        this.right = x + radius;
        this.bottom = y + radius;
        this.x = x;
        this.y = y;
        this.radius = radius;
    };

    /**
     * init Scheme.
     */
    (function () {
        canvas = document.getElementById(schemeID);
        list = document.getElementById(listID);
        ctx = canvas.getContext('2d');
        labels = JSON.parse(labelsJSON);

        if (typeof params === 'object') {
            setConfig(params);
        }

        setSchemeImage(src);
        setEventsListeners();
    }.call(this));

    /**
     * Apply user parameters.
     * @param {object} params Custom configurations.
     */
    function setConfig(params) {
        for (var param in params) {
            config[param] = params[param];
        }
    }

    /**
     * Set Scheme image.
     * @param src
     */
    function setSchemeImage(src) {
        schemeImg = new Image();
        schemeImg.src = src;
    }

    /**
     * Set events listeners.
     */
    function setEventsListeners() {
        var items = list.getElementsByClassName('part_number');

        schemeImg.addEventListener('load', drawScheme);
        canvas.addEventListener('click', areaClicked);
        canvas.addEventListener('mousemove', areaHovered);
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', itemClicked);
        }
    }

    /**
     * Set canvas size.
     * @param w
     * @param h
     */
    function setCanvasSize(w, h) {
        canvas.width = w;
        canvas.height = h;
    }

    /**
     * Push area to array of areas.
     * @param name
     * @param x
     * @param y
     * @param radius
     */
    function saveArea(name, x, y, radius) {
        var area = new Area(name, x, y, radius);
        areas.push(area);
    }

    /**
     * Area click handler.
     * @param e Event
     */
    function areaClicked(e) {
        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];

            if (coordsInArea(e.offsetX, e.offsetY, area)) {
                toggleHighlight(area.name);
            }
        }
    }

    /**
     * Area hover handler.
     * @param e
     */
    function areaHovered(e) {
        if (!Object.keys(hoveredArea).length) {
            for (var i = 0; i < areas.length; i++) {
                var area = areas[i];
                if (coordsInArea(e.offsetX, e.offsetY, area)) {
                    hoveredArea = area;
                    utility.addClass(canvas, 'pointer');
                    break;
                }
            }
        } else if (!coordsInArea(e.offsetX, e.offsetY, hoveredArea)) {
            hoveredArea = {};
            utility.removeClass(canvas, 'pointer');
        }
    }

    /**
     * Check if coordinates match an area.
     * @param {int} x
     * @param {int} y
     * @param {Area} area
     * @returns {bool}
     */
    function coordsInArea(x, y, area) {
        return utility.inRange(x, area.left, area.right) && utility.inRange(y, area.top, area.bottom);
    }

    /**
     * List item click handler.
     */
    function itemClicked() {
        var partNumber = this.getAttribute("data-part-number");
        toggleHighlight(partNumber);
    }

    /**
     * Toggle highlight of list items and scheme areas.
     * @param partNumber
     */
    function toggleHighlight(partNumber) {
        var foundAreas = findAllAreas(partNumber);

        if (foundAreas.length) {
            if (removeSelectedAreas(partNumber).length) {
                toggleItemHighlight(partNumber, utility.removeClass);
                redrawScheme();
            } else {
                selectedAreas = selectedAreas.concat(foundAreas);
                toggleItemHighlight(partNumber, utility.addClass);
                redrawScheme();
            }
        }
    }

    /**
     * Remove selected areas from array.
     * @param name
     * @returns {Array} Array of removed areas.
     */
    function removeSelectedAreas(name) {
        var removed = [];
        for (var i = 0; i < selectedAreas.length; i++) {
            if (selectedAreas[i].name == name) {
                var r = selectedAreas.splice(i, 1);
                removed = removed.concat(r);
                i--;
            }
        }

        return removed;
    }

    /**
     * Toggle item highlight with specified function.
     * @param partNumber
     * @param func Function for class changing.
     */
    function toggleItemHighlight(partNumber, func) {
        var items = list.querySelectorAll('[data-part-number="' + partNumber + '"]');

        for (var i = 0; i < items.length; i++) {
            var item = items[i].parentElement;
            func(item, 'selected');
        }
    }

    /**
     * Find all areas with specified name.
     * @param name
     * @return {Array}
     */
    function findAllAreas(name) {
        var foundAreas = [];
        for (var i = 0; i < areas.length; i++) {
            if (areas[i].name === name) {
                foundAreas.push(areas[i]);
            }
        }
        return foundAreas;
    }

    /**
     * Draw the scheme with labels and selected areas.
     */
    function drawScheme() {
        var w = schemeImg.width + config.padding * 2,
            h = schemeImg.height + config.padding * 2;
        setCanvasSize(w, h);
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(schemeImg, config.padding, config.padding);

        drawLabels();
        drawSelectedAreas();
    }

    /**
     * Redraw the scheme. Clear canvas and areas array.
     */
    function redrawScheme() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        areas = [];
        drawScheme();
    }

    /**
     * Draw labels by coordinates from the labels array.
     */
    function drawLabels() {
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i],
                text = label['sLabel'],
                x = parseInt(label['label_x1']) + config.padding,
                y = parseInt(label['label_y1']) + config.padding;

            drawLabel(text, x, y);
        }
    }

    /**
     * Draw a label on the scheme.
     * @param text
     * @param x
     * @param y
     */
    function drawLabel(text, x, y) {
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = config.fontSize + ' ' + config.fontFamily;
        ctx.fillStyle = config.fontColor;
        ctx.fillText(text, x, y);
        // drawArea(x, y, config.areaRadius);
        saveArea(text, x, y, config.areaRadius);
        ctx.restore();
    }

    /**
     * Draw selected areas on the scheme.
     */
    function drawSelectedAreas() {
        for (var i = 0; i < selectedAreas.length; i++) {
            var area = selectedAreas[i];
            drawArea(area.x, area.y, area.radius);
        }
    }

    /**
     * Draw circle area.
     * @param x
     * @param y
     * @param radius
     */
    function drawArea(x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = config.areaColor;
        ctx.stroke();
    }
};

/**
 * Utility object
 */
var utility = {
    toggleClass: function (obj, cls) {
        var classes = obj.className.split(' ');

        classes.indexOf(cls) == -1 ? this.addClass(obj, cls) : this.removeClass(obj, cls);
    },

    addClass: function (obj, cls) {
        var classes = obj.className.split(' ');

        if (classes.indexOf(cls) == -1) {
            classes.push(cls);
        }

        obj.className = classes.join(' ');
    },

    removeClass: function (obj, cls) {
        var classes = obj.className.split(' ');

        for (var i = 0; i < classes.length; i++) {
            if (classes[i] == cls) {
                classes.splice(i, 1);
                i--;
            }
        }
        obj.className = classes.join(' ');
    },

    inRange: function (val, min, max) {
        return val >= min && val <= max;
    }
};
