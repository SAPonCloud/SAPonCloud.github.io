sap.ui.define([], function () {
    "use strict";
    return {
        directionIcon: function (sDirection) {
            if (sDirection === '1') {
                return "sap-icon://outbox";
            } else {
                return "sap-icon://inbox";
            }
        },

        directionText: function (sDirection) {
            if (sDirection === '1') {
                return "Outbound";
            } else {
                return "Inbound";
            }
        },

        directionState: function (sDirection) {
            if (sDirection === '1') {
                return "Information";
            } else {
                return "Success";
            }
        },
    }
});