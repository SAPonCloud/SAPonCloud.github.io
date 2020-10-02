sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
  ],
  function (Controller, JSONModel, library, MessageBox, MessageToast) {
    "use strict";

    // shortcut for sap.f.DynamicPageTitleArea
    var DynamicPageTitleArea = library.DynamicPageTitleArea;

    return Controller.extend("zlhsl.controller.Interfaces", {
      onInit: function () {
        var oExitButton = this.getView().byId("exitFullScreenBtn"),
          oEnterButton = this.getView().byId("enterFullScreenBtn");

        this.oRouter = this.getOwnerComponent().getRouter();
        this.oModel = this.getOwnerComponent().getModel("layout");

        this.oRouter.getRoute("detail").attachPatternMatched(this._onFunctionMatched, this);
        this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onFunctionMatched, this);

        this._interface = null;

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
      onListItemPress: function (oEvent) {
        var interfaceid = oEvent.getSource().getCells()[0].getProperty("title"),
          oNextUIState;
        this.getOwnerComponent().getHelper().then(function (oHelper) {
          oNextUIState = oHelper.getNextUIState(2);
          this.oRouter.navTo("detailDetail", {
            layout: oNextUIState.layout,
            functionid: this._functionid,
            interfaceid: interfaceid
          });
        }.bind(this));
      },

      onSelectionChange: function (oEvent) {
        var interfaceid = oEvent.getSource().getSelectedItem().getCells()[0].getProperty("title"),
          sPath = "/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + interfaceid + "')";

        debugger;
        var oSmartForm = this.getView().byId("idInterfaceSmartForm");
        oSmartForm.bindElement(sPath);
        oSmartForm.getModel().setDefaultBindingMode("TwoWay");
        oSmartForm.setProperty("visible", true);
        if (oSmartForm.getProperty("editable")) {
          oSmartForm.setProperty("title", "Change Interface");
        } else {
          oSmartForm.setProperty("title", "Interface");
        }

        /* Get selected Interface entity*/
        this._interface = this.getView().getModel().getData(sPath);
      },

      _checkDataChanged: function () {
        if (this._interface !==
          this.getView().byId("idInterfaceSmartForm").getModel().getData(
            this.getView().byId("idInterfaceSmartForm").getBindingContext().getPath())) {
          MessageBox.confirm("Function has changed. Discard Changes?",
            function (oAction) {
              if (oAction === 'OK') {
                this.getView().byId("idInterfaceSmartForm").getModel().resetChanges();
              } else {
                this.getView().byId("idInterfaceSmartForm").setEditable(true);
              };
            }.bind(this));
        }
      },

      onEditToggled: function (oEvent) {
        var bEditable = oEvent.getParameter("editable");

        if (this._function !== null && bEditable === false) {
          this._checkDataChanged();
        }

        if (bEditable) {
          this.getView().byId("idInterfaceSmartForm").setProperty("title", "Change Function");
        } else {
          this.getView().byId("idInterfaceSmartForm").setProperty("title", "Function");
        }

        this.toggleFooter();
      },

      _onFunctionMatched: function (oEvent) {
        var oModel = this.getOwnerComponent().getModel();
        this.getView().setModel(oModel, "functions");
        this._functionid = oEvent.getParameter("arguments").functionid || this._functionid || "0";
        this.getView().bindElement({
          path: "/FunctionSet('" + this._functionid + "')",
          model: "functions"
        });

        oModel.read("/FunctionSet('" + this._functionid + "')" + "/ToInterfaces", {
          success: function (oData) {
            debugger;
            var oJSONModel = new JSONModel();
            oJSONModel.setData(oData.results);
            this.getView().byId("idInterfaceTable").setModel(oJSONModel, "interfaces");
          }.bind(this)
        });
      },
      getPage: function () {
        return this.byId("dynamicPageId");
      },
      toggleFooter: function () {
        this.getPage().setShowFooter(this.getView().byId("idInterfaceSmartForm").getEditable());
      },

      toggleAreaPriority: function () {
        var oTitle = this.getPage().getTitle(),
          sNewPrimaryArea = oTitle.getPrimaryArea() === DynamicPageTitleArea.Begin ? DynamicPageTitleArea.Middle : DynamicPageTitleArea.Begin;
        oTitle.setPrimaryArea(sNewPrimaryArea);
      },

      onDelete: function (oEvent) {
        debugger;
        this._functionid = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
        MessageBox.confirm("It will delete interface '" +
          this._functionid +
          "' and all its related configurations permanently. Proceed?",
          function (oAction) {
            if (oAction === 'OK') {
              MessageToast.show("Interface '" + this._functionid + "' deleted succcessfully.");
            } else {
              MessageToast.show("Deletion cancelled.");
            }
          }.bind(this)
        );
      },

      onCreate: function (oEvent) {
        this._bCreateMode = true;
        this._interface = null;

        var oSmartForm = this.byId("idInterfaceSmartForm"),
          oDataModel = this.getView().getModel();
        oSmartForm.unbindContext();
        oSmartForm.getModel().setDefaultBindingMode("TwoWay");
        oSmartForm.setBindingContext(oDataModel.createEntry("/FunctionSet('" + this._functionid + "')/InterfaceSet", {
          // groupId: "newFunction",
          refreshAfterChange: true,
          success: function () {
            debugger;
            this._bCreateMode = null;
            MessageToast.show("Interface created successfully.");
            // this.getView().byId("idInterfaceSmartForm").setEditable(false);
            oSmartForm.setProperty("title", "Change Interface");
            // this.toggleFooter();
            this.getView().setBusy(false);
          }.bind(this)
        }));

        oSmartForm.setProperty("visible", true);
        oSmartForm.setEditable(true);
        oSmartForm.setProperty("title", "Create Function");
        this.toggleFooter();
      },

      onSave: function (oEvent) {
        var oSmartForm = this.getView().byId("idInterfaceSmartForm");
        debugger;
        if (!this._bCreateMode) {
          var oDataModel = oSmartForm.getModel(),
            sBindingPath = oSmartForm.getBindingContext().getPath();
          if (this._function !== oDataModel.getData(sBindingPath)) {
            var oData = oDataModel.getObject(sBindingPath);
            delete oData.ToSegments;
            delete oData.ToFields;
            delete oData.__metadata;
            oDataModel.update(sBindingPath,
              oData, {
                success: function (oData) {
                  debugger;
                  this.getView().byId("idInterfaceSmartForm").setEditable(false);
                  this.toggleFooter();
                  MessageToast.show("Interface updated successfully.")
                }.bind(this),
                error: function (oError) {
                  MessageBox.error("Changes could not be saved.");
                },
                refreshAfterChange: true
              }
            );
          } else {
            MessageToast.show("Interface is unchanged");
          }
        } else {
          this.getView().setBusy(true);
          debugger;
          this.getView().byId("idInterfaceSmartForm").getModel().submitChanges({
            // groupId: "newFunction",
            success: function (oData) {
              debugger;
              this.getView().setBusy(false);
              this.getView().byId("idInterfaceSmartForm").setEditable(false);
              // this.toggleFooter();
              MessageToast.show("Function created successfully.");

              this._bCreateMode = null;
            }.bind(this),
            error: function (oError) {
              debugger;
              MessageBox.error("Function could not be created.");
              this.getView().setBusy(false);
              this._bCreateMode = null;
              // this.getView().byId("idInterfaceSmartForm").setProperty("visible", false);
            }.bind(this)
          });
          this.getView().byId("idInterfaceSmartForm").getModel().resetChanges();
        }
      },

      onCancel: function (oEvent) {
        var oSmartForm = this.getView().byId("idInterfaceSmartForm");
        if (this._bCreateMode) {
          oSmartForm.getModel().deleteCreatedEntry(oSmartForm.getBindingContext());
          oSmartForm.setBindingContext(null)
          oSmartForm.setVisible(false);
          this._bCreateMode = false;
        } else {
          oSmartForm.getModel().resetChanges();
        }
        oSmartForm.setEditable(false);
        this.toggleFooter();
      },

      onValidationError: function (oEvent) {
        MessageBox.error(oEvent.getParameter("message"));
        this.getView().byId("idSaveBtn").setEnabled(false);
      },

      onValidationSuccess: function (oEvent) {
        this.getView().byId("idSaveBtn").setEnabled(true);
      },

      handleFullScreen: function () {
        this.bFocusFullScreenButton = true;
        var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        this.oRouter.navTo("detail", {
          layout: sNextLayout,
          functionid: this._functionid
        });
      },

      handleExitFullScreen: function () {
        this.bFocusFullScreenButton = true;
        var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
        this.oRouter.navTo("detail", {
          layout: sNextLayout,
          functionid: this._functionid
        });
      },

      handleClose: function () {
        var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
        this.oRouter.navTo("master", {
          layout: sNextLayout
        });
      }
    });
  });