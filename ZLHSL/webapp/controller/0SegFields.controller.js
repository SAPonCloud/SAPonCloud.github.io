sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller"
], function (JSONModel, Controller) {
    'use strict';

    return Controller.extend("zlhsl.controller.SegFields", {
        onInit: function () {
            var oExitButton = this.getView().byId("exitFullScreenBtn"),
                oEnterButton = this.getView().byId("enterFullScreenBtn");

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oModel = this.getOwnerComponent().getModel("layout");

            // this.oRouter.getRoute("detail").attachPatternMatched(this._onInterfaceMatched, this);
            this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onInterfaceMatched, this);

            [oExitButton, oEnterButton].forEach(function (oButton) {
                oButton.addEventDelegate({
                    onAfterRendering: function () {
                        if (this.bFocusFullScreenButton) {
                            this.bFocusFullScreenButton = false;
                            oButton.focus();
                        }
                    }.bind(this)
                });
            }, this);
        },

        _onInterfaceMatched: function (oEvent) {
            var oModel = this.getOwnerComponent().getModel();
            this._functionid = oEvent.getParameter("arguments").functionid || this._functionid;
            this._interfaceid = oEvent.getParameter("arguments").interfaceid || this._interfaceid;
            this.getView().setModel(oModel, "interfaces");
            this.getView().bindElement({
                path: "/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')",
                model: "interfaces"
            });

            oModel.read("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')" +
                "/ToSegments", {
                    success: function (oData) {
                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(oData.results);
                        this.getView().byId("idSegmentsTable").setModel(oJSONModel, "segments");
                    }.bind(this)
                });

            oModel.read("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')" +
                "/ToFields", {
                    success: function (oData) {
                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(oData.results);
                        this.getView().byId("idFieldsTable").setModel(oJSONModel, "fields");
                    }.bind(this)
                });
        },

        handleFullScreen: function () {
            this.bFocusFullScreenButton = true;
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.oRouter.navTo("detailDetail", {
                layout: sNextLayout,
                functionid: this._functionid,
                interfaceid: this._interfaceid
            });
        },
        handleExitFullScreen: function () {
            this.bFocusFullScreenButton = true;
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
            this.oRouter.navTo("detailDetail", {
                layout: sNextLayout,
                functionid: this._functionid,
                interfaceid: this._interfaceid
            });
        },

        handleClose: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
            this.oRouter.navTo("detail", {
                layout: sNextLayout,
                functionid: this._functionid
            });
        },

        onExit: function () {
            this.oRouter.getRoute("detailDetail").detachPatternMatched(this._onPatternMatch, this);
        },

        onSelectSegment: function (oEvent) {
            // this.getView().setModel(this.getOwnerComponent().getModel(), "fields");
            // this.getView().bindElement({
            //     path: "/FieldSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid +
            //         "',SegmentName='" + oEvent.getSource().getCells()[0].getProperty("title") + "')",
            //     model: "fields"
            // });
        }
    })

});