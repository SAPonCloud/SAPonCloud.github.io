sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/odata/v2/ODataModel"
	],
	function (Controller, Filter, FilterOperator, Sorter, MessageBox, MessageToast, JSONModel, ODataModel) {
		"use strict";

		return Controller.extend("zlhsl.controller.Functions", {
			onInit: function () {
				this._bDescendingSort = false;
				this._function = null; // This is 'Function' entity and not just 'FunctionID'
				this.oRouter = this.getOwnerComponent().getRouter();
			},

			onSearch: function (oEvent) {
				debugger;
				var oTableSearchState = [],
					sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					oTableSearchState = [
						new Filter("FunctionText", FilterOperator.Contains, sQuery) ||
						new Filter("FunctionID", FilterOperator.Contains, sQuery)
					];
				}

				this.getView()
					.byId("functionsTable")
					.getBinding("items")
					.filter(oTableSearchState, "Application");
			},

			onSort: function () {
				//Toggle the sorting
				this._bDescendingSort = !this._bDescendingSort;
				var oView = this.getView(),
					oTable = oView.byId("functionsTable"),
					oBinding = oTable.getBinding("items"),
					oSorter = new Sorter("FunctionID", this._bDescendingSort);

				oBinding.sort(oSorter);
			},

			onCreate: function (oEvent) {
				this._bCreateMode = true;
				this._function = null;

				var oSmartForm = this.byId("idSmartForm"),
					oDataModel = this.getView().getModel();
				oSmartForm.unbindContext();
				oSmartForm.getModel().setDefaultBindingMode("TwoWay");
				oSmartForm.setBindingContext(oDataModel.createEntry("/FunctionSet", {
					// groupId: "newFunction",
					refreshAfterChange: true,
					success: function () {
						debugger;
						this._bCreateMode = null;
						MessageToast.show("Function created successfully.");
						// this.getView().byId("idSmartForm").setEditable(false);
						oSmartForm.setProperty("title", "Change Function");
						// this.toggleFooter();
						this.getView().setBusy(false);
					}.bind(this)
				}));

				oSmartForm.setProperty("visible", true);
				oSmartForm.setEditable(true);
				oSmartForm.setProperty("title", "Create Function");
				this.toggleFooter();
			},

			onSelectionChange: function (oEvent) {
				// var oDataModel = this.getOwnerComponent().getModel();
				var oSmartForm = this.getView().byId("idSmartForm");
				oSmartForm.bindElement(oEvent.getSource().getSelectedContextPaths()[0]);
				oSmartForm.getModel().setDefaultBindingMode("TwoWay");
				oSmartForm.setProperty("visible", true);
				if (oSmartForm.getProperty("editable")) {
					oSmartForm.setProperty("title", "Change Function");
				} else {
					oSmartForm.setProperty("title", "Function");
				}

				this._function = this.getView().getModel().getData(oEvent.getSource().getSelectedContextPaths()[0]);
				// this.getView().byId("idSwitch").getModel().setDefaultBindingMode("TwoWay");
			},

			onListItemPress: function (oEvent) {
				var functionid = oEvent.getSource().getBindingContext().getProperty("FunctionID"),
					oNextUIState;
				this.getOwnerComponent().getHelper().then(function (oHelper) {
					oNextUIState = oHelper.getNextUIState(1);
					this.oRouter.navTo("detail", {
						layout: oNextUIState.layout,
						functionid: functionid
					});
				}.bind(this));
				this.getView().byId("idSmartForm").bindElement("/FunctionSet('" + functionid + "')");
			},

			onUpdateFinished: function (oEvent) {
				var scount = oEvent.getParameter("total");
				var oTitle = this.getView().byId("entityTitle");
				oTitle.setProperty(
					"text",
					this.getOwnerComponent()
					.getModel("i18n")
					.getResourceBundle()
					.getText("title.text.Functions") +
					" (" + scount + ")"
				);
			},

			toggleFooter: function () {
				this.getPage().setShowFooter(this.getView().byId("idSmartForm").getEditable());
				// this.getPage().setShowFooter(!this.getPage().getShowFooter());
			},
			toggleAreaPriority: function () {
				var oTitle = this.getPage().getTitle(),
					sNewPrimaryArea = oTitle.getPrimaryArea() === DynamicPageTitleArea.Begin ? DynamicPageTitleArea.Middle : DynamicPageTitleArea.Begin;
				oTitle.setPrimaryArea(sNewPrimaryArea);
			},

			onSave: function (oEvent) {
				if (!this._bCreateMode) {
					var oDataModel = this.getView().byId("idSmartForm").getModel();
					if (this._function !==
						oDataModel.getData(this.getView().byId("idSmartForm").getBindingContext().getPath())) {
						var oData = oDataModel.getObject(this.getView().byId("idSmartForm").getBindingContext().getPath());
						delete oData.ToInterfaces;
						delete oData.__metadata;
						oDataModel.update(this.getView().byId("idSmartForm").getBindingContext().getPath(),
							oData, {
								success: function (oData) {
									this.getView().byId("idSmartForm").setEditable(false);
									this.toggleFooter();
									MessageToast.show("Function updated successfully.");
								}.bind(this),
								error: function (oError) {
									MessageBox.error("Changes could not be saved.");
								}
							}
						);
					} else {
						MessageToast.show("Function is unchanged");
					}
				} else {
					this.getView().setBusy(true);
					debugger;
					this.getView().byId("idSmartForm").getModel().submitChanges({
						// groupId: "newFunction",
						success: function (oData) {
							debugger;
							this.getView().setBusy(false);
							this.getView().byId("idSmartForm").setEditable(false);
							// this.toggleFooter();
							MessageToast.show("Function created successfully.");

							this._bCreateMode = null;
						}.bind(this),
						error: function (oError) {
							debugger;
							MessageBox.error("Function could not be created.");
							this.getView().setBusy(false);
							this._bCreateMode = null;
							// this.getView().byId("idSmartForm").setProperty("visible", false);
						}.bind(this)
					});
					this.getView().byId("idSmartForm").getModel().resetChanges();
				}
			},

			// onFormatError: function (oEvent) {
			// 	debugger;
			// },
			// onChecked: function (oEvent) {
			// 	debugger;
			// },

			onValidationError: function (oEvent) {
				debugger;
				MessageBox.error(oEvent.getParameter("message"));
				this.getView().byId("idSaveBtn").setEnabled(false);
			},

			onValidationSuccess: function (oEvent) {
				this.getView().byId("idSaveBtn").setEnabled(true);
			},

			onCancel: function (oEvent) {
				var oSmartForm = this.getView().byId("idSmartForm");
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

			_checkDataChanged: function () {
				if (this._function !==
					this.getView().byId("idSmartForm").getModel().getData(this.getView().byId("idSmartForm").getBindingContext().getPath())) {
					MessageBox.confirm("Function has changed. Discard Changes?",
						function (oAction) {
							if (oAction === 'OK') {
								this.getView().byId("idSmartForm").getModel().resetChanges();
							} else {
								this.getView().byId("idSmartForm").setEditable(true);
							};
						}.bind(this));
				}
			},

			onEditToggled: function (oEvent) {
				var bEditable = oEvent.getParameter("editable");

				if (this._function !== null && bEditable === false) {
					this._checkDataChanged();
				}

				// this.getView().byId("idSwitch").setProperty("enabled", bEditable);
				if (bEditable) {
					this.getView().byId("idSmartForm").setProperty("title", "Change Function");
				} else {
					this.getView().byId("idSmartForm").setProperty("title", "Function");
				}
				this.toggleFooter();
			},

			onDelete: function (oEvent) {
				this._functionid = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
				this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
				MessageBox.confirm("It will delete function '" +
					this._functionid +
					"' and all its related configurations permanently. Proceed?",
					function (oAction) {
						if (oAction === 'OK') {
							this.getView().setBusy(true);
							this.getView().byId("idSmartForm").setProperty("visible", false);
							this.getView().getModel().remove(this._sPath, {
								success: function () {
									this.getView().setBusy(false);
									MessageToast.show("Function '" + this._functionid + "' deleted succcessfully.");
								}.bind(this),
								error: function () {
									debugger;
									this.getView().setBusy(false);
									MessageToast.show("Error occured while deleting Function '" + this._functionid);
								}.bind(this),
								refreshAfterChange: true
							})

						} else {
							MessageToast.show("Deletion cancelled.");
						}
					}.bind(this)
				);
			},

			onClone: function (oEvent) {
				//this.toggleFooter();
			},

			getPage: function () {
				return this.byId("dynamicPageId");
			}
		});
	}
);