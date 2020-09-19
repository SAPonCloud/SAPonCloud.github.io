sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("zlhsl.controller.Interface", {
    onInit: function () {
      var oExitButton = this.getView().byId("exitFullScreenBtn"),
        oEnterButton = this.getView().byId("enterFullScreenBtn");

      this.oRouter = this.getOwnerComponent().getRouter();
      this.oModel = this.getOwnerComponent().getModel("layout");

      this.oRouter.getRoute("detail").attachPatternMatched(this._onFunctionMatched, this);
      this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onFunctionMatched, this);

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
    handleItemPress: function (oEvent) {
      var interfaceid,
        oNextUIState;
      this.getOwnerComponent().getHelper().then(function (oHelper) {
        oNextUIState = oHelpergetNextUIState(2);
        this.oRouter.navTo("detailDetail", {
          layout: oNextUIState.layout,
          functionid: this._functionid,
          interfaceid: interfaceid
        });
      }.bind(this));
    },
    handleFullScreen: function () {
      this.bFocusFullScreenButton = true;
      var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
      this.oRouter.navTo("detail", { layout: sNextLayout, product: this._functionid });
    },
    handleExitFullScreen: function () {
      this.bFocusFullScreenButton = true;
      var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
      this.oRouter.navTo("detail", { layout: sNextLayout, product: this._functionid });
    },
    handleClose: function () {
      var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
      this.oRouter.navTo("master", { layout: sNextLayout });
    },
    _onFunctionMatched: function (oEvent) {
      debugger;
      this._functionid = oEvent.getParameter("arguments").functionid || this._functionid || "0";
      var oModel = this.getOwnerComponent().getModel();
      oModel.read();
      // this.getView().bindElement({
      //   path: "/FunctionSet/" + this._functionid,
      //   model: "functions"
      // });
    }
  });
});
