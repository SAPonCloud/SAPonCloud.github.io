sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "zlhslc/model/formatter"
], function (Controller, Filter, FilterOperator, Sorter, MessageBox, MessageToast, formatter) {
    'use strict';

    return Controller.extend("zlhslc.controller.SegFields", {

        formatter: formatter,

        onInit: function () {
            var oExitButton = this.getView().byId("exitFullScreenBtn"),
                oEnterButton = this.getView().byId("enterFullScreenBtn");

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oModel = this.getOwnerComponent().getModel("layout");

            this.oRouter.getRoute("detail").attachPatternMatched(this._onInterfaceMatched, this);
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
            // var oModel = this.getOwnerComponent().getModel();
            this._functionid = oEvent.getParameter("arguments").functionid || this._functionid;
            this._interfaceid = oEvent.getParameter("arguments").interfaceid || this._interfaceid;

            this.getView().bindElement(
                "/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')", {
                    expand: "ToSegments"
                });
            var oSegmentSmartForm = this.byId("idSegmentSmartForm");
            var oFieldSmartForm = this.byId("idFieldSmartForm");

            // if (this._functionid !== this._functionidtmp || this._interfaceid !== this._interfaceidtmp) {

            //     if (oSegmentSmartForm.getEditable()) {
            //         if (this._bSegCreateMode) {
            //             oSegmentSmartForm.getModel().deleteCreatedEntry(oSegmentSmartForm.getBindingContext());
            //             oSegmentSmartForm.setBindingContext(null);
            //             this._bSegCreateMode = false;
            //         }
            //         oSegmentSmartForm.getModel().resetChanges();
            //         MessageToast.show("Segment editing was cancelled.");
            //         oSegmentSmartForm.setVisible(false);
            //         oSegmentSmartForm.setEditable(false);
            //     }

            //     if (oFieldSmartForm.getEditable()) {
            //         if (this._bFieldCreateMode) {
            //             oFieldSmartForm.getModel().deleteCreatedEntry(oFieldSmartForm.getBindingContext());
            //             oFieldSmartForm.setBindingContext(null);
            //             this._bFieldCreateMode = false;
            //         }
            //         oFieldSmartForm.getModel().resetChanges();
            //         MessageToast.show("Field editing was cancelled.");
            //         oFieldSmartForm.setVisible(false);
            //         oFieldSmartForm.setEditable(false);
            //     }
            // }

            oSegmentSmartForm.bindElement("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')/ToSegments");

            oFieldSmartForm.bindElement("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')/ToFields");

            this._functionidtmp = this._functionid;
            this._interfaceidtmp = this._interfaceid;
        },

        _checkCreateMode: function () {
            if (this._bFieldCreateMode) {
                MessageToast.show("You are already in Field creation mode. Save or cancel the current data first.");
                return true;
            } else if (this._bSegCreateMode) {
                MessageToast.show("You are already in Segment creation mode. Save or cancel the current data first.");
                return true;
            }
        },

        onCreateField: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }
            this.getView().byId("idScrollContainerField").setProperty("height", "200px");
            this._bFieldCreateMode = true;
            this._fields = null;
            var oSmartFormField = this.byId("idFieldSmartForm"),
                oDataModel = this.getView().getModel();
            oSmartFormField.unbindContext();
            oSmartFormField.getModel().setDefaultBindingMode("TwoWay");
            oSmartFormField.setBindingContext(oDataModel.createEntry("/FieldSet", {
                refreshAfterChange: true,
                properties: {
                    FunctionID: this._functionid,
                    InterfaceID: this._interfaceid
                },
                success: function () {
                    this._bFieldCreateMode = null;
                    MessageToast.show("Field created successfully.");
                    oSmartFormField.setProperty("title", "Change Field");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be created.");
                    this.getView().setBusy(false);
                    this._bFieldCreateMode = null;
                }.bind(this)
            }));

            oSmartFormField.setVisible(true);
            oSmartFormField.setEditable(true);
            oSmartFormField.setProperty("title", "Create Field");
        },

        onEditToggledField: function (oEvent) {
            this._bFieldEditable = oEvent.getParameter("editable");

            if (this._bSegEditable) {
                MessageToast.show("A segment is being edited. Please save or cancel the changes first.");
                this.getView().byId("idFieldSmartForm").setEditable(false);
            }

            if (this._fields !== null && this._bFieldEditable === false) {
                this._checkFieldDataChanged();
            }

            if (this._bFieldEditable) {
                this.getView().byId("idFieldSmartForm").setProperty("title", "Change Field");
            } else {
                this.getView().byId("idFieldSmartForm").setProperty("title", "IDoc Field");
            }

            this.toggleFooter();
        },

        _checkFieldDataChanged: function () {
            if (this._fields !==
                this.getView().byId("idFieldSmartForm").getModel().getData(
                    this.getView().byId("idFieldSmartForm").getBindingContext().getPath())) {
                MessageBox.confirm("Field details have changed. Discard Changes?",
                    function (oAction) {
                        if (oAction === 'OK') {
                            this.getView().byId("idFieldSmartForm").getModel().resetChanges();
                        } else {
                            this.getView().byId("idFieldSmartForm").setEditable(true);
                        };
                    }.bind(this));
            }
        },

        onSelectSegment: function (oEvent) {
            this.getView().byId("idScrollContainerSeg").setProperty("height", "200px");
            var segmentName = oEvent.getSource().getCells()[0].getProperty("title"),
                sPath = "/IDocSegmentSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "',SegmentName='" + segmentName + "')";

            var oSmartForm = this.getView().byId("idSegmentSmartForm");
            oSmartForm.bindElement(sPath);
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setProperty("visible", true);
            if (oSmartForm.getProperty("editable")) {
                oSmartForm.setProperty("title", "Change IDoc Segment");
            } else {
                oSmartForm.setProperty("title", "IDoc Segment");
            }

            /* Get selected Interface entity*/
            this._idocsegment = this.getView().getModel().getData(sPath);
        },

        onSelectField: function (oEvent) {
            var segmentName = oEvent.getSource().getCells()[0].getProperty("title"),
                fieldName = oEvent.getSource().getCells()[1].getProperty("title"),
                counter = oEvent.getSource().getCells()[2].getProperty("title"),
                sPath = "/FieldSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "',Segment='" + segmentName + "',FieldName='" + fieldName + "',Counter='" + counter + "')";

            var oSmartForm = this.getView().byId("idFieldSmartForm");
            oSmartForm.bindElement(sPath);
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setProperty("visible", true);
            if (oSmartForm.getProperty("editable")) {
                oSmartForm.setProperty("title", "Change Segment Field");
            } else {
                oSmartForm.setProperty("title", "Segment Field");
            }

            /* Get selected Interface entity*/
            this._fields = this.getView().getModel().getData(sPath);

            this.getView().byId("idScrollContainerField").setProperty("height", "250px");
        },

        onCreateSegment: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }
            this.getView().byId("idScrollContainerSeg").setProperty("height", "200px");
            this._bSegCreateMode = true;
            this._idocsegment = null;
            var oSmartForm = this.byId("idSegmentSmartForm"),
                oDataModel = this.getView().getModel();
            oSmartForm.unbindContext();
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setBindingContext(oDataModel.createEntry("/IDocSegmentSet", {
                refreshAfterChange: true,
                properties: {
                    FunctionID: this._functionid,
                    InterfaceID: this._interfaceid
                },
                success: function () {
                    this._bSegCreateMode = null;
                    MessageToast.show("IDoc Segment created successfully.");
                    oSmartForm.setProperty("title", "Change IDoc Segment");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be created.");
                    this.getView().setBusy(false);
                    this._bSegCreateMode = null;
                }.bind(this)
            }));

            oSmartForm.setVisible(true);
            oSmartForm.setEditable(true);
            oSmartForm.setProperty("title", "Create IDoc Segment");
        },

        onDeleteField: function (oEvent) {
            this._segment = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
            this._field = oEvent.getSource().getParent().getParent().getAggregation("cells")[1].getProperty("title");
            this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
            MessageBox.confirm("It will delete Field '" +
                this._field +
                "' from segment '" + this._segment + "' permanently. Proceed?",
                function (oAction) {
                    if (oAction === 'OK') {
                        this.getView().setBusy(true);
                        this.getView().byId("idFieldSmartForm").setVisible(false);
                        this.getView().getModel().remove(this._sPath, {
                            refreshAfterChange: true,
                            success: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Field '" + this._field + "' deleted from Segment '" + this._segment + "' succcessfully.");
                            }.bind(this),
                            error: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Error occured while deleting Field '" + this._field + "' from Segment '" + this._segment + "'");
                            }.bind(this)
                        });
                        this.getView().byId("idSegmentSmartForm").setEditable(false);
                    } else {
                        MessageToast.show("Deletion cancelled.");
                    }
                }.bind(this)
            );
        },

        onDeleteSegment: function (oEvent) {
            this._segment = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
            this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
            MessageBox.confirm("It will delete IDoc Segment '" +
                this._segment +
                "' and all its related fields permanently. Proceed?",
                function (oAction) {
                    if (oAction === 'OK') {
                        this.getView().setBusy(true);
                        this.getView().byId("idSegmentSmartForm").setProperty("visible", false);
                        this.getView().getModel().remove(this._sPath, {
                            refreshAfterChange: true,
                            success: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Segment '" + this._segment + "' deleted succcessfully.");
                                this.getView().getModel().refresh();
                            }.bind(this),
                            error: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Error occured while deleting Segment '" + this._segment + "'");
                            }.bind(this)
                        });
                        this.getView().byId("idSegmentSmartForm").setEditable(false);
                    } else {
                        MessageToast.show("Deletion cancelled.");
                    }
                }.bind(this)
            );
        },

        onSave: function (oEvent) {
            var oSmartForm = this.getView().byId("idSegmentSmartForm");

            if (this._bSegCreateMode) {
                this.getView().setBusy(true);
                oSmartForm.getModel().submitChanges({
                    // groupId: "newFunction",
                    success: function (oData) {
                        this.getView().setBusy(false);
                        this.getView().byId("idSegmentSmartForm").setEditable(false);
                        // this.toggleFooter();
                        MessageToast.show("IDoc Segment created successfully.");
                        this._bSegCreateMode = null;
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("IDoc Segment could not be created.");
                        this.getView().setBusy(false);
                        this._bSegCreateMode = null;
                        // this.getView().byId("idInterfaceSmartForm").setProperty("visible", false);
                    }.bind(this)
                });
                oSmartForm.getModel().resetChanges();

            } else if (this.bSegEditable) {

                var oDataModel = oSmartForm.getModel(),
                    sBindingPath = oSmartForm.getBindingContext().getPath();
                if (this._idocsegment !== oDataModel.getData(sBindingPath)) {
                    var oData = oDataModel.getObject(sBindingPath);
                    delete oData.__metadata;
                    oDataModel.update(sBindingPath,
                        oData, {
                            success: function (oData) {
                                this.getView().byId("idSegmentSmartForm").setEditable(false);
                                this.toggleFooter();
                                MessageToast.show("IDoc Segment updated successfully.")
                            }.bind(this),
                            error: function (oError) {
                                MessageBox.error("Changes could not be saved.");
                            },
                            refreshAfterChange: true
                        }
                    );
                } else {
                    MessageToast.show("IDocSegment is unchanged");
                }
            }
            oSmartForm = null;

            var oFieldSmartForm = this.getView().byId("idFieldSmartForm");

            if (this._bFieldCreateMode) {
                this.getView().setBusy(true);
                oFieldSmartForm.getModel().submitChanges({
                    // groupId: "newFunction",
                    success: function (oData) {
                        this.getView().setBusy(false);
                        this.getView().byId("idFieldSmartForm").setEditable(false);
                        // this.toggleFooter();
                        MessageToast.show("Field was created successfully.");
                        this._bFieldCreateMode = null;
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Field could not be created.");
                        this.getView().setBusy(false);
                        this._bFieldCreateMode = null;
                        // this.getView().byId("idInterfaceSmartForm").setProperty("visible", false);
                    }.bind(this)
                });
                oFieldSmartForm.getModel().resetChanges();

            } else if (this.bFieldEditable) {

                var oDataModel = oFieldSmartForm.getModel(),
                    sBindingPath = oFieldSmartForm.getBindingContext().getPath();
                if (this._idocsegment !== oDataModel.getData(sBindingPath)) {
                    var oData = oDataModel.getObject(sBindingPath);
                    delete oData.__metadata;
                    oDataModel.update(sBindingPath,
                        oData, {
                            success: function (oData) {
                                this.getView().byId("idFieldSmartForm").setEditable(false);
                                this.toggleFooter();
                                MessageToast.show("Field updated successfully.")
                            }.bind(this),
                            error: function (oError) {
                                MessageBox.error("Changes could not be saved.");
                            },
                            refreshAfterChange: true
                        }
                    );
                } else {
                    MessageToast.show("Field is unchanged");
                }
            }
        },

        onCancel: function (oEvent) {
            var oSegmentSmartForm = this.getView().byId("idSegmentSmartForm");
            if (this._bSegCreateMode) {
                oSegmentSmartForm.getModel().deleteCreatedEntry(oSegmentSmartForm.getBindingContext());
                oSegmentSmartForm.setBindingContext(null)
                oSegmentSmartForm.setVisible(false);
                this._bSegCreateMode = false;
            } else {
                oSegmentSmartForm.getModel().resetChanges();
            }

            oSegmentSmartForm.setEditable(false);

            var oFieldSmartForm = this.getView().byId("idFieldSmartForm");
            if (this._bFieldCreateMode) {
                oFieldSmartForm.getModel().deleteCreatedEntry(oFieldSmartForm.getBindingContext());
                oFieldSmartForm.setBindingContext(null)
                oFieldSmartForm.setVisible(false);
                this._bFieldCreateMode = false;
            } else {
                oFieldSmartForm.getModel().resetChanges();
            }
            oFieldSmartForm.setEditable(false);
            debugger;
            this.toggleFooter();
        },

        _checkDataChanged: function () {
            if (this._idocsegment !==
                this.getView().byId("idSegmentSmartForm").getModel().getData(
                    this.getView().byId("idSegmentSmartForm").getBindingContext().getPath())) {
                MessageBox.confirm("IDoc Segment has changed. Discard Changes?",
                    function (oAction) {
                        if (oAction === 'OK') {
                            this.getView().byId("idSegmentSmartForm").getModel().resetChanges();
                        } else {
                            this.getView().byId("idSegmentSmartForm").setEditable(true);
                        };
                    }.bind(this));
            }
        },

        onEditToggledSeg: function (oEvent) {
            this._bSegEditable = oEvent.getParameter("editable");

            if (this._bFieldEditable) {
                MessageToast.show("A field is being edited. Please save or cancel the changes first.");
                this.getView().byId("idSegmentSmartForm").setEditable(false);
            }

            if (this._idocsegment !== null && this._bSegEditable === false) {
                this._checkDataChanged();
            }

            if (this._bSegEditable) {
                this.getView().byId("idSegmentSmartForm").setProperty("title", "Change IDoc Segment");
            } else {
                this.getView().byId("idSegmentSmartForm").setProperty("title", "IDoc Segment");
            }

            this.toggleFooter();
        },

        onCloneSegment: function (oEvent) {

            if (this._checkCreateMode()) {
                return;
            }
            this.getView().byId("idScrollContainerSeg").setProperty("height", "200px");
            this._bSegCreateMode = true;
            this._idocsegment = null;

            var oSmartForm = this.byId("idSegmentSmartForm"),
                oDataModel = this.getView().getModel(),
                sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
                oData = oDataModel.getData(sPath);

            delete oData.__metadata;
            oData.SegmentName = oData.SegmentName + "_COPY";

            oSmartForm.unbindContext();
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setBindingContext(oDataModel.createEntry("/IDocSegmentSet", {
                refreshAfterChange: true,
                properties: oData,
                success: function () {
                    this._bSegCreateMode = null;
                    MessageToast.show("IDoc Segment copied successfully.");
                    oSmartForm.setProperty("title", "Change IDoc Segment");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be copied.");
                    this.getView().setBusy(false);
                    this._bSegCreateMode = null;
                }.bind(this)
            }));

            oSmartForm.setVisible(true);
            oSmartForm.setEditable(true);
            oSmartForm.setProperty("title", "Copy IDoc Segment");

        },

        onCloneField: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }
            this.getView().byId("idScrollContainerField").setProperty("height", "200px");
            this._bFieldCreateMode = true;
            this._fields = null;
            var oSmartFormField = this.byId("idFieldSmartForm"),
                oDataModel = this.getView().getModel(),
                sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
                oData = oDataModel.getData(sPath);

            delete oData.__metadata;
            oData.Segment = oData.Segment + "_COPY";
            oData.FieldName = oData.FieldName + "_COPY";

            oSmartFormField.unbindContext();
            oSmartFormField.getModel().setDefaultBindingMode("TwoWay");
            oSmartFormField.setBindingContext(oDataModel.createEntry("/FieldSet", {
                refreshAfterChange: true,
                properties: oData,
                success: function () {
                    this._bFieldCreateMode = null;
                    MessageToast.show("Field copied successfully.");
                    oSmartFormField.setProperty("title", "Change Field");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be copied.");
                    this.getView().setBusy(false);
                    this._bFieldCreateMode = null;
                }.bind(this)
            }));

            oSmartFormField.setVisible(true);
            oSmartFormField.setEditable(true);
            oSmartFormField.setProperty("title", "Copy Field");
        },

        onSearchSegments: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [
                    new Filter("SegmentName", FilterOperator.Contains, sQuery),
                    new Filter("ParentSegment", FilterOperator.Contains, sQuery),
                ];

                this.getView()
                    .byId("idSegmentsTable")
                    .getBinding("items")
                    .filter(new Filter({
                        filters: oTableSearchState,
                        and: false
                    }));

            } else {
                this.getView()
                    .byId("idSegmentsTable")
                    .getBinding("items").filter([]);
            }
        },

        onSearchFields: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [
                    new Filter("Segment", FilterOperator.Contains, sQuery),
                    new Filter("FieldName", FilterOperator.Contains, sQuery),
                ];

                this.getView()
                    .byId("idFieldsTable")
                    .getBinding("items")
                    .filter(new Filter({
                        filters: oTableSearchState,
                        and: false
                    }));

            } else {
                this.getView()
                    .byId("idFieldsTable")
                    .getBinding("items").filter([]);
            }
        },

        onSortSegments: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oView = this.getView(),
                oTable = oView.byId("idSegmentsTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("SegmentName", this._bDescendingSort);

            oBinding.sort(oSorter);
        },

        onSortFields: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oView = this.getView(),
                oTable = oView.byId("idFieldsTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("FieldName", this._bDescendingSort);

            oBinding.sort(oSorter);
        },

        onValidationError: function (oEvent) {
            MessageBox.error(oEvent.getParameter("message"));
            this.getView().byId("idSaveBtn").setEnabled(false);
        },

        onValidationSuccess: function (oEvent) {
            this.getView().byId("idSaveBtn").setEnabled(true);
        },

        getPage: function () {
            return this.byId("ObjectPageLayout");
        },

        toggleFooter: function () {
            this.getPage().setShowFooter(
                (this.getView().byId("idSegmentSmartForm").getEditable() && this.getView().byId("idSegmentSmartForm").getVisible()) ||
                (this.getView().byId("idFieldSmartForm").getEditable() && this.getView().byId("idFieldSmartForm").getVisible()));
        },

        toggleAreaPriority: function () {
            var oTitle = this.getPage().getTitle(),
                sNewPrimaryArea = oTitle.getPrimaryArea() === DynamicPageTitleArea.Begin ? DynamicPageTitleArea.Middle : DynamicPageTitleArea.Begin;
            oTitle.setPrimaryArea(sNewPrimaryArea);
        },
        onSegUpdateFinished: function (oEvent) {
            var count = oEvent.getParameter("total");
            if (count > 0) {
                var oTitle = this.getView().byId("idSegmentList");
                oTitle.setProperty("title", "Segments(" + count + ")");
            }
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
        }
    })

});