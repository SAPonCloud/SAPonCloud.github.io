sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/odata/v2/ODataModel",
		"sap/ui/core/Fragment"
	],
	function (Controller, Filter, FilterOperator, Sorter, MessageBox, MessageToast, JSONModel, ODataModel, Fragment) {
		"use strict";

		return Controller.extend("zlhslc.controller.Functions", {
			onInit: function () {
				this._bDescendingSort = false;
				this._function = null; // This is 'Function' entity and not just 'FunctionID'
				this.oRouter = this.getOwnerComponent().getRouter();
			},

			onSearch: function (oEvent) {
				var oTableSearchState = [],
					sQuery = oEvent.getParameter("query"),
					sNewValue = oEvent.getParameter("newValue");

				if ((sQuery && sQuery.length > 0) || (sNewValue)) {
					if (oEvent.getParameter("newValue")) {
						sQuery = sNewValue;
					}
					oTableSearchState = [
						new Filter("FunctionID", FilterOperator.Contains, sQuery),
						new Filter("FunctionText", FilterOperator.Contains, sQuery),
					];

					this.getView()
						.byId("functionsTable")
						.getBinding("items")
						.filter(new Filter({
							filters: oTableSearchState,
							and: false
						}));

				} else {
					this.getView()
						.byId("functionsTable")
						.getBinding("items").filter([]);
				}
			},

			onSettingsPress: function () {
				// creates dialog list if not yet created
				// if (!this._oDialogs) {
				// 	this._oDialogs = {};
				// }

				// creates requested dialog if not yet created
				if (!this._oDialogs) {
					Fragment.load({
						name: "zlhslc.view.fragment.ViewSettingsDialog",
						controller: this
					}).then(function (oDialog) {
						this._oDialogs = oDialog;
						this.getView().addDependent(this._oDialogs);

						// this._oDialogs.bindFilterItems("filterItems>/items", function (sId, oContext) {
						// 	debugger;
						// 	return new sap.m.ViewSettingsFilterItem({
						// 		key: oContext.getObject().template,
						// 		text: oContext.getObject().label,
						// 		multiSelect: true,
						// 		items: this.getViewSettingsItems(oContext.getObject().template, oContext.getObject().type)
						// 	});
						// }.bind(this));

						// debugger;
						// var oFilterModel = new JSONModel();
						// oFilterModel.setData({
						// 	items: this._aCols
						// });
						// this._oFilterDialog.setModel(oFilterModel, "filterItems");
						// oFilterModel.refresh();

						// opens the dialog
						this._oDialogs.open();
					}.bind(this));
				} else {
					// opens the requested dialog
					this._oDialogs.open();
				}
			},

			getViewSettingsItems: function (template, type) {
				var aItems = [];
				var aUsed = [];
				var oReportModel = this.getOwnerComponent().getModel("dynamicReportModel");
				oReportModel.getObject("/").forEach(function (oRow, index) {
					if (!aUsed.includes(oRow[template])) {
						var formattedText;
						switch (type) {
							case "@":
								formattedText = this.formatter.iconText(oRow[template]);
								break;
							case "N":
								formattedText = this.formatter.docnum(oRow[template]);
								break;
							case "D":
								formattedText = this.formatter.date(oRow[template]);
								break;
							default:
								formattedText = oRow[template];
								break;
						}
						aUsed.push(oRow[template]);
						aItems.push(new sap.m.ViewSettingsItem({
							text: formattedText,
							key: template + "___" + "EQ" + "___" + oRow[template] + "___X"
						}));
					}
				}.bind(this));
				return aItems;
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
					success: function (oData) {
						debugger;
						this._bCreateMode = null;
						MessageToast.show("Function created successfully.");
						// this.getView().byId("idSmartForm").setEditable(false);
						oSmartForm.setProperty("title", "Change Function");
						// this.toggleFooter();
						this.getView().setBusy(false);
					}.bind(this),

					error: function (oError) {
						MessageBox.error("Function could not be created.");
						this.getView().setBusy(false);
						// this._bCreateMode = null;
					}.bind(this)
				}));

				this.getView().byId("idSFPanel").setVisible(true);
				oSmartForm.setVisible(true);
				oSmartForm.setEditable(true);
				oSmartForm.setProperty("title", "Create Function");

				this.setTableHeight();
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
				// this.getView().byId("idSmartForm").bindElement("/FunctionSet('" + functionid + "')");
			},

			onUpdateFinished: function (oEvent) {
				var iCount = oEvent.getParameter("total");
				var oTitle = this.getView().byId("entityTitle");
				oTitle.setProperty(
					"text",
					this.getOwnerComponent()
					.getModel("i18n")
					.getResourceBundle()
					.getText("title.text.Functions") +
					" (" + iCount + ")"
				);
				this.getView().byId("functionsTable").setBusy(false);

				this._iFuncCount = iCount;
				this.setTableHeight();
			},

			setTableHeight: function () {
				if (this._iFuncCount > 5 && this.byId("idSFPanel").getVisible()) {
					this.byId("idScrollContainer").setProperty("height", "240px");
				} else {
					this.byId("idScrollContainer").setProperty("height", "auto");
				}
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
					this.getView().byId("idSFPanel").setVisible(false);
					this._bCreateMode = false;
				} else {
					oSmartForm.getModel().resetChanges();
				}
				oSmartForm.setEditable(false);
				this.toggleFooter();
			},

			_fnCheckOnEditToggled: function (oAction) {
				if (oAction === 'OK') {
					this.getView().byId("idSmartForm").getModel().resetChanges();
				} else {
					this.getView().byId("idSmartForm").setEditable(true);
				};
			},

			_fnCheckOnSwitchFunction: function (oAction) {
				if (oAction === 'OK') {
					this.getView().byId("idSmartForm").getModel().resetChanges();
					this.showFunctionDetails(this._sPath, true);
				}
				delete this._sPath;
			},

			_checkDataChanged: function (fnName) {
				if (this._function !==
					this.getView().byId("idSmartForm").getModel().getData(this.getView().byId("idSmartForm").getBindingContext().getPath())) {

					MessageBox.confirm("Function has changed. Discard Changes?", fnName.bind(this));
					return true;

				} else {
					return false;
				}
			},

			onEditToggled: function (oEvent) {
				var bEditable = oEvent.getParameter("editable");

				if (this._function !== null && bEditable === false) {
					this._checkDataChanged(this._fnCheckOnEditToggled);
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
							this.getView().byId("idSmartForm").setVisible(false);;
							this.getView().byId("idSFPanel").setVisible(false);
							this.getView().getModel().remove(this._sPath, {
								success: function () {
									this.getView().setBusy(false);
									MessageToast.show("Function '" + this._functionid + "' deleted succcessfully.");
									this._sPath = null;
								}.bind(this),
								error: function () {
									debugger;
									this.getView().setBusy(false);
									MessageToast.show("Error occured while deleting Function '" + this._functionid);
									this._sPath = null;
								}.bind(this),
								refreshAfterChange: true
							})

						} else {
							MessageToast.show("Deletion cancelled.");
							this._sPath = null;
						}
					}.bind(this)
				);
			},

			onClone: function (oEvent) {
				this._bCreateMode = true;
				this._function = null;
				debugger;
				var oSmartForm = this.byId("idSmartForm"),
					oDataModel = this.getView().getModel(),
					sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
					oData = oDataModel.getData(sPath);
				// delete oData.ToInterfaces;
				// delete oData.__metadata;

				oData.FunctionID = oData.FunctionID + "_COPY";

				oSmartForm.unbindContext();
				oSmartForm.getModel().setDefaultBindingMode("TwoWay");
				oSmartForm.setBindingContext(oDataModel.createEntry("/FunctionSet", {
					refreshAfterChange: true,
					success: function () {
						debugger;
						this._bCreateMode = null;
						MessageToast.show("Function copied successfully.");
						// this.getView().byId("idSmartForm").setEditable(false);
						oSmartForm.setProperty("title", "Change Function");
						// this.toggleFooter();
						this.getView().setBusy(false);
					}.bind(this),

					error: function (oError) {
						debugger;
						MessageBox.error("Function could not be copied.");
						this.getView().setBusy(false);
						// this._bCreateMode = null;
					}.bind(this),

					properties: oData
				}));

				this.getView().byId("idSFPanel").setVisible(true);
				oSmartForm.setVisible(true);
				oSmartForm.setEditable(true);
				oSmartForm.setProperty("title", "Copy Function");
				this.setTableHeight();
			},

			showFunctionDetails: function (sPath, bVisible) {
				this.getView().byId("idSFPanel").setVisible(true);
				this.setTableHeight();
				var oSmartForm = this.getView().byId("idSmartForm");
				oSmartForm.setVisible(true);
				oSmartForm.setEditable(bVisible);
				if (oSmartForm.getEditable()) {
					oSmartForm.setProperty("title", "Change Function");
				} else {
					oSmartForm.setProperty("title", "Function");
				}
				oSmartForm.bindElement(sPath);
				oSmartForm.getModel().setDefaultBindingMode("TwoWay");
				this._function = this.getView().getModel().getData(sPath);
			},

			onTitlePress: function (oEvent) {
				var sPath = oEvent.getSource().getBindingContext().getPath();
				this.showFunctionDetails(sPath, false);
			},

			onEdit: function (oEvent) {
				this._sPath = oEvent.getSource().getBindingContext().getPath();
				var bChanged = false;

				if (this._function !== null) {
					if (this._function.FunctionID === oEvent.getSource().getBindingContext().getProperty("FunctionID")) {
						MessageToast.show("Function '" + this._function.FunctionID + "' is already being edited.");
						return;
					}
					bChanged = this._checkDataChanged(this._fnCheckOnSwitchFunction);
				}

				if (!bChanged) {
					this.showFunctionDetails(this._sPath, true);
					delete this._sPath;
				}
			},

			getPage: function () {
				return this.byId("dynamicPageId");
			},

			handleConfirm: function (oEvent) {
				this.performSortGroup(oEvent);

				this.performFilter(oEvent);
			},

			performFilter: function (oEvent) {
				var oParams = oEvent.getParameters(),
					oTable = this.getView().byId("functionsTable"),
					oBinding = oTable.getBinding("items"),
					aFilters = [];

				if (oParams.filterItems) {
					oParams.filterItems.forEach(function (oItem) {
						var aSplit = oItem.getKey().split("___"),
							sPath = aSplit[0],
							sOperator = aSplit[1],
							sValue1 = aSplit[2],
							sValue2 = aSplit[3],
							oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
						aFilters.push(oFilter);
					});
				}
				oBinding.filter(aFilters);
				this.byId("idFilterLabel").setText(oParams.filterString);
			},

			performSortGroup: function (oEvent) {
				var oParams = oEvent.getParameters(),
					oTable = this.getView().byId("functionsTable"),
					oBinding = oTable.getBinding("items"),
					sPath,
					aSorters = [],
					aGroups = [];
				aSorters.push(new Sorter(oParams.sortItem.getKey(), oParams.sortDescending, null));

				if (oParams.groupItem) {
					sPath = oParams.groupItem.getKey();
					aGroups.push(new Sorter(sPath, oParams.groupDescending,
						function (oContext) {
							var name = oContext.getProperty(sPath);
							return {
								key: name,
								text: name
							};
						}
					));
				}
				aGroups = aGroups.concat(aSorters);
				oBinding.sort(aGroups);
			},

			// onExit - destroy created dialogs
			onExit: function () {
				if (this._oDialogs) {
					this._oDialogs.destroy();
				}
				this._oDialogs = null;
			},

			onFilterPage: function (oEvent) {
				var aValues = [];
				var aNewItems = [];
				oEvent.getParameters().parentFilterItem.getItems().forEach(function (oItem, i) {
					if (!aValues.includes(oItem.getKey())) {
						aNewItems.push(oItem);
					}
					aValues.push(oItem.getKey());
				});
				oEvent.getParameters().parentFilterItem.removeAllItems();
				aNewItems.forEach(function (oItem, i) {
					oEvent.getParameters().parentFilterItem.addItem(oItem);
				});
			},

			// onSelectionChange: function (oEvent) {
			// 	this.getView().byId("idSFPanel").setVisible(true);
			// 	// var oDataModel = this.getOwnerComponent().getModel();
			// 	var oSmartForm = this.getView().byId("idSmartForm");
			// 	oSmartForm.setVisible(true);
			// 	if (oSmartForm.getProperty("editable")) {
			// 		oSmartForm.setProperty("title", "Change Function");
			// 	} else {
			// 		oSmartForm.setProperty("title", "Function");
			// 	}
			// 	oSmartForm.bindElement(oEvent.getSource().getSelectedContextPaths()[0]);
			// 	oSmartForm.getModel().setDefaultBindingMode("TwoWay");
			//	
			// 	this._function = this.getView().getModel().getData(oEvent.getSource().getSelectedContextPaths()[0]);
			// },

			// onSort: function () {
		});
	});