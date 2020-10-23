sap.ui.define([], function () {
    "use strict";
    return {
        directionIcon: function (sDirection) {
            if (sDirection === '1') {
                return "sap-icon://outbox";
            } else if (sDirection === '2') {
                return "sap-icon://inbox";
            }
        },

        directionText: function (sDirection) {
            if (sDirection === '1') {
                return "Outbound";
            } else if (sDirection === '2') {
                return "Inbound";
            }
        },

        directionState: function (sDirection) {
            if (sDirection === '1') {
                return "Information";
            } else if (sDirection === '2') {
                return "Success";
            }
        },
    }
});