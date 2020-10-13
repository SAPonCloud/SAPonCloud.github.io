sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/f/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "zlhslc/model/formatter"
  ],
  function (Controller, Filter, FilterOperator, Sorter, library, MessageBox, MessageToast, formatter) {
    "use strict";

    // shortcut for sap.f.DynamicPageTitleArea
    var DynamicPageTitleArea = library.DynamicPageTitleArea;

    return Controller.extend("zlhslc.controller.Interfaces", {

      formatter: formatter,

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

      onSearch: function (oEvent) {
        var oTableSearchState = [],
          sQuery = oEvent.getParameter("query");

        if (sQuery && sQuery.length > 0) {
          oTableSearchState = [
            new Filter("InterfaceID", FilterOperator.Contains, sQuery),
            new Filter("InterfaceText", FilterOperator.Contains, sQuery),
          ];


          this.getView()
            .byId("idInterfaceTable")
            .getBinding("items")
            .filter(new Filter({
              filters: oTableSearchState,
              and: false
            }));
        } else {
          this.getView()
            .byId("idInterfaceTable")
            .getBinding("items").filter([]);
        }
      },

      onSort: function () {
        this._bDescendingSort = !this._bDescendingSort;
        var oView = this.getView(),
          oTable = oView.byId("idInterfaceTable"),
          oBinding = oTable.getBinding("items"),
          oSorter = new Sorter("InterfaceID", this._bDescendingSort);

        oBinding.sort(oSorter);
      },

      onSelectionChange: function (oEvent) {
        var interfaceid = oEvent.getSource().getSelectedItem().getCells()[0].getProperty("title"),
          sPath = "/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + interfaceid + "')";

        this.getView().byId("idSFPanel").setVisible(true);

        var oSmartForm = this.getView().byId("idInterfaceSmartForm");
        oSmartForm.bindElement(sPath);
        oSmartForm.getModel().setDefaultBindingMode("TwoWay");
        oSmartForm.setVisible(true);
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
          MessageBox.confirm("Interface has changed. Discard Changes?",
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

        if (this._interface !== null && bEditable === false) {
          this._checkDataChanged();
        }

        if (bEditable) {
          this.getView().byId("idInterfaceSmartForm").setProperty("title", "Change Interface");
        } else {
          this.getView().byId("idInterfaceSmartForm").setProperty("title", "Interface");
        }

        this.toggleFooter();
      },

      _onFunctionMatched: function (oEvent) {
        this._functionid = oEvent.getParameter("arguments").functionid || this._functionid || "0";
        this.getView().bindElement("/FunctionSet('" + this._functionid + "')", {
          expand: 'ToInterfaces'
        });

        var oInterfaceSmartForm = this.byId("idInterfaceSmartForm");

        // if (this._functionidtmp !== null && this._functionidtmp !== this._functionid) {
        //   if (oInterfaceSmartForm.getEditable()) {
        //     if (this._bCreateMode) {
        //       oInterfaceSmartForm.getModel().deleteCreatedEntry(oInterfaceSmartForm.getBindingContext());
        //       oInterfaceSmartForm.setBindingContext(null);
        //       this._bCreateMode = false;
        //     }
        //     oInterfaceSmartForm.getModel().resetChanges();
        //     MessageToast.show("Interface editing was cancelled.");
        //   }
        //   oInterfaceSmartForm.setVisible(false);
        //   oInterfaceSmartForm.setEditable(false);
        // }

        this._functionidtmp = this._functionid;
        oInterfaceSmartForm.bindElement("/FunctionSet('" + this._functionid + "')" + "/ToInterfaces");
      },

      onDelete: function (oEvent) {
        this._interfaceid = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
        this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
        MessageBox.confirm("It will delete Interface '" +
          this._interfaceid +
          "' and all its related configurations permanently. Proceed?",
          function (oAction) {
            if (oAction === 'OK') {
              this.getView().setBusy(true);
              this.getView().byId("idInterfaceSmartForm").setVisible(false);
              this.getView().byId("idSFPanel").setVisible(false);
              this.getView().getModel().remove(this._sPath, {
                refreshAfterChange: true,
                success: function () {
                  this.getView().setBusy(false);
                  MessageToast.show("Interface '" + this._interfaceid + "' deleted succcessfully.");
                }.bind(this),
                error: function () {
                  this.getView().setBusy(false);
                  MessageToast.show("Error occured while deleting Interface '" + this._interfaceid);
                }.bind(this)
              });
              this.getView().byId("idInterfaceSmartForm").setEditable(false);
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
        oSmartForm.setBindingContext(oDataModel.createEntry("/InterfaceSet", {
          refreshAfterChange: true,
          properties: {
            FunctionID: this._functionid
          },
          success: function () {
            this._bCreateMode = null;
            MessageToast.show("Interface created successfully.");
            // this.getView().byId("idInterfaceSmartForm").setEditable(false);
            oSmartForm.setProperty("title", "Change Interface");
            this.getView().setBusy(false);
          }.bind(this),
          error: function () {
            MessageBox.error("Interface could not be created.");
            this.getView().setBusy(false);
            this._bCreateMode = null;
          }.bind(this)
        }));
        this.getView().byId("idSFPanel").setVisible(true);
        oSmartForm.setVisible(true);
        oSmartForm.setEditable(true);
        oSmartForm.setProperty("title", "Create Function");
      },

      onClone: function (oEvent) {
        this._bCreateMode = true;
        this._interface = null;

        var oSmartForm = this.byId("idInterfaceSmartForm"),
          oDataModel = this.getView().getModel(),
          sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
          oData = oDataModel.getData(sPath);

        delete oData.ToSegments;
        delete oData.ToFields;
        delete oData.__metadata;
        oData.InterfaceID = oData.InterfaceID + "_COPY";

        oSmartForm.unbindContext();
        oSmartForm.getModel().setDefaultBindingMode("TwoWay");
        oSmartForm.setBindingContext(oDataModel.createEntry("/InterfaceSet", {
          refreshAfterChange: true,
          properties: oData,
          success: function () {
            this._bCreateMode = null;
            MessageToast.show("Interface copied successfully.");
            oSmartForm.setProperty("title", "Change Interface");
            this.getView().setBusy(false);
          }.bind(this),
          error: function () {
            MessageBox.error("Interface could not be copied.");
            this.getView().setBusy(false);
            this.getView().setVisible(false);
            this._bCreateMode = null;
          }.bind(this)
        }));

        this.getView().byId("idSFPanel").setVisible(true);
        oSmartForm.setVisible(true);
        oSmartForm.setEditable(true);
        oSmartForm.setProperty("title", "Copy Function");

      },

      onSave: function (oEvent) {
        var oSmartForm = this.getView().byId("idInterfaceSmartForm");

        if (!this._bCreateMode) {
          var oDataModel = oSmartForm.getModel(),
            sBindingPath = oSmartForm.getBindingContext().getPath();
          if (this._interface !== oDataModel.getData(sBindingPath)) {
            var oData = oDataModel.getObject(sBindingPath);
            delete oData.ToSegments;
            delete oData.ToFields;
            delete oData.__metadata;
            oDataModel.update(sBindingPath,
              oData, {
                success: function (oData) {
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
          this.getView().byId("idInterfaceSmartForm").getModel().submitChanges({
            // groupId: "newFunction",
            success: function (oData) {
              this.getView().setBusy(false);
              this.getView().byId("idInterfaceSmartForm").setEditable(false);
              // this.toggleFooter();
              MessageToast.show("Function created successfully.");

              this._bCreateMode = null;
            }.bind(this),
            error: function (oError) {
              MessageBox.error("Interface could not be created.");
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
          this.getView().byId("idSFPanel").setVisible(false);
          oSmartForm.getModel().deleteCreatedEntry(oSmartForm.getBindingContext());
          oSmartForm.setBindingContext(null);
          oSmartForm.setVisible(false);
          this._bCreateMode = false;
        } else {
          oSmartForm.getModel().resetChanges();
        }
        oSmartForm.setEditable(false);
        oSmartForm.setVisible(false);
        this.getView().byId("idSFPanel").setVisible(false);
        this.toggleFooter();
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
      },
      onUpdateFinished: function (oEvent) {
        var count = oEvent.getParameter("total");
        var oScrollContainer = this.getView().byId("idScrollContainer"),
          oTitle = this.getView().byId("idTabTitle");
        oTitle.setProperty("text", "Interfaces (" + count + ")");
        switch (count) {
          case 0:
            oScrollContainer.setProperty("height", "100px");
            break;
          case 1:
            oScrollContainer.setProperty("height", "100px");
            break;
          case 2:
            oScrollContainer.setProperty("height", "150px");
            break;
          case 3:
            oScrollContainer.setProperty("height", "170px");
            break;
          default:
            oScrollContainer.setProperty("height", "215px");
            break;
        }
      }
    });
  });