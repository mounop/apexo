import * as core from "@core";
import { imagesTable, text } from "@core";
import { PatientAppointmentsPanel } from "@modules";
import * as modules from "@modules";
import { formatDate } from "@utils";
import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import * as loadable from "react-loadable";
import {
	Col,
	DataTableComponent,
	LastNextAppointment,
	PanelTabs,
	PanelTop,
	ProfileComponent,
	ProfileSquaredComponent,
	Row,
	TableActions,
	TagInputComponent,
} from "@common-components";
import {
	DefaultButton,
	Icon,
	IconButton,
	MessageBar,
	MessageBarType,
	Panel,
	PanelType,
	PersonaInitialsColor,
	PrimaryButton,
	Shimmer,
	TextField,
} from "office-ui-fabric-react";

const PatientDetailsPanel = loadable({
	loader: async () =>
		(await import("modules/patients/components/patient-details"))
			.PatientDetailsPanel,
	loading: () => <Shimmer />,
});
const DentalHistoryPanel = loadable({
	loader: async () =>
		(await import("modules/patients/components/dental-history"))
			.DentalHistoryPanel,
	loading: () => <Shimmer />,
});
const OrthoCaseSheetPanel = loadable({
	loader: async () =>
		(await import("modules/orthodontic/components/case-sheet"))
			.OrthoCaseSheetPanel,
	loading: () => <Shimmer />,
});
const OrthoRecordsPanel = loadable({
	loader: async () =>
		(await import("modules/orthodontic/components/records"))
			.OrthoRecordsPanel,
	loading: () => <Shimmer />,
});
const OrthoGalleryPanel = loadable({
	loader: async () =>
		(await import("modules/orthodontic/components/ortho-gallery"))
			.OrthoGalleryPanel,
	loading: () => <Shimmer />,
});

const AppointmentEditorPanel = loadable({
	loader: async () =>
		(await import("modules/appointments/components/appointment-editor"))
			.AppointmentEditorPanel,
	loading: () => <Shimmer />,
});

@observer
export class OrthoPage extends React.Component {
	@observable showAdditionPanel: boolean = false;
	@observable newPatientName: string = "";

	@observable selectedAppointmentId = "";

	@computed get selectedCase() {
		return modules.orthoCases!.docs.find(
			(orthoCase) => orthoCase._id === core.router.selectedID
		);
	}

	@computed get selectedPatient() {
		if (this.selectedCase) {
			if (this.selectedCase.patient) {
				return this.selectedCase.patient;
			}
		}
	}

	@computed get canEdit() {
		return core.user.currentUser!.canEditOrtho;
	}

	@computed get selectedAppointment() {
		return modules.appointments!.docs.find(
			(x) => x._id === this.selectedAppointmentId
		);
	}

	tabs = [
		{
			key: "details",
			title: text("patient details").h,
			icon: "DietPlanNotebook",
		},
		{
			key: "dental",
			title: text("dental history").h,
			icon: "teeth",
		},
		{
			key: "sheet",
			title: text("case details").h,
			icon: "GroupedList",
		},
		{
			key: "archive",
			title: text("visits").h,
			icon: "Archive",
		},
		{
			key: "gallery",
			title: text("gallery").h,
			icon: "PhotoCollection",
		},
		{
			key: "appointments",
			title: text("appointments").h,
			icon: "Calendar",
			hidden: !core.user.currentUser!.canViewAppointments,
		},
		{
			key: "delete",
			title: text("delete").h,
			icon: "Trash",
			hidden: !this.canEdit,
		},
	];

	render() {
		return (
			<div className="orthodontic-cases-component">
				<DataTableComponent
					maxItemsOnLoad={10}
					className={"orthodontic-cases-data-table"}
					heads={[
						text("orthodontic patient").h,
						`${text("started").h}/${text("finished").h} ${text(
							"treatment"
						)}`,
						`${text("previous").h}/${text("next").h} ${text(
							"appointment"
						)}`,
						`${text("total").h}/${text("outstanding").h} ${
							text("payment").h
						}`,
					]}
					rows={modules
						.orthoCases!.docs.filter(
							(orthoCase) => orthoCase.patient
						)
						.map((orthoCase) => {
							const patient = orthoCase.patient!;
							return {
								id: orthoCase._id,
								searchableString: orthoCase.searchableString,
								actions: this.tabs
									.filter((x) => !x.hidden)
									.map((x) => ({
										key: x.key,
										title: x.title,
										icon: x.icon,
										onClick: () => {
											if (x.key === "delete") {
												modules.orthoCases!.deleteModal(
													orthoCase._id
												);
											} else {
												core.router.select({
													id: orthoCase._id,
													tab: x.key,
												});
											}
										},
									})),
								cells: [
									{
										dataValue: patient.name,
										component: (
											<div>
												<ProfileComponent
													name={patient.name}
													avatar={
														patient.avatar
															? imagesTable.table[
																	patient
																		.avatar
															  ]
																? imagesTable
																		.table[
																		patient
																			.avatar
																  ]
																: imagesTable.fetchImage(
																		patient.avatar
																  )
															: undefined
													}
													secondaryElement={
														<span className="itl">
															<span className="cap">
																{text(
																	patient.gender
																)}
															</span>{" "}
															- {patient.age}{" "}
															{text("years old")}
														</span>
													}
													size={3}
												/>
												<br />
											</div>
										),
										className: "no-label",
										onClick: () => {
											core.router.select({
												id: orthoCase._id,
												tab: "sheet",
											});
										},
									},
									{
										dataValue: orthoCase.isFinished
											? Infinity
											: orthoCase.startedDate,
										component: (
											<div>
												<ProfileSquaredComponent
													text={
														orthoCase.isStarted
															? formatDate(
																	orthoCase.startedDate,
																	modules.setting!.getSetting(
																		"date_format"
																	)
															  )
															: ""
													}
													subText={
														orthoCase.isStarted
															? text(
																	"started treatment"
															  ).c
															: text(
																	"has not started yet"
															  ).c
													}
													size={3}
													onRenderInitials={() => (
														<Icon iconName="info" />
													)}
													initialsColor={
														orthoCase.isStarted
															? PersonaInitialsColor.teal
															: PersonaInitialsColor.transparent
													}
												/>
												<ProfileSquaredComponent
													text={
														orthoCase.isFinished
															? formatDate(
																	orthoCase.finishedDate,
																	modules.setting!.getSetting(
																		"date_format"
																	)
															  )
															: ""
													}
													subText={
														orthoCase.isFinished
															? text(
																	"finished treatment"
															  ).c
															: text(
																	"has not finished yet"
															  ).c
													}
													size={3}
													onRenderInitials={() => (
														<Icon iconName="CheckMark" />
													)}
													initialsColor={
														orthoCase.isFinished
															? PersonaInitialsColor.blue
															: PersonaInitialsColor.transparent
													}
												/>
											</div>
										),
										className: "hidden-xs",
									},
									{
										dataValue: (
											patient.nextAppointment || {
												date: 0,
											}
										).date,
										component: (
											<LastNextAppointment
												lastAppointment={
													patient.lastAppointment
												}
												nextAppointment={
													patient.nextAppointment
												}
												onClick={(id) => {
													this.selectedAppointmentId = id;
													core.router.select({
														sub: "details",
													});
												}}
											></LastNextAppointment>
										),
										className: "hidden-xs",
									},
									{
										dataValue: patient.totalPayments,
										component: (
											<div>
												<ProfileSquaredComponent
													text={
														modules.setting!.getSetting(
															"currencySymbol"
														) +
														patient.totalPayments.toString()
													}
													subText={
														text("payments made").c
													}
													size={3}
													onRenderInitials={() => (
														<Icon iconName="CheckMark" />
													)}
													initialsColor={
														patient.totalPayments >
														0
															? PersonaInitialsColor.darkBlue
															: PersonaInitialsColor.transparent
													}
												/>
												<ProfileSquaredComponent
													text={
														modules.setting!.getSetting(
															"currencySymbol"
														) +
														(patient.differenceAmount <
														0
															? patient.outstandingAmount.toString()
															: patient.differenceAmount >
															  0
															? patient.overpaidAmount.toString()
															: "0")
													}
													subText={
														patient.differenceAmount <
														0
															? text(
																	"outstanding amount"
															  ).c
															: patient.differenceAmount >
															  0
															? text(
																	"overpaid amount"
															  ).c
															: text(
																	"no outstanding amount"
															  ).c
													}
													size={3}
													onRenderInitials={() => (
														<Icon iconName="Cancel" />
													)}
													initialsColor={
														patient.differenceAmount !==
														0
															? PersonaInitialsColor.darkRed
															: PersonaInitialsColor.transparent
													}
												/>
											</div>
										),
										className: "hidden-xs",
									},
								],
							};
						})}
					commands={
						this.canEdit
							? [
									{
										key: "addNew",
										title: "Add new",
										name: text("add new").c,
										onClick: () =>
											(this.showAdditionPanel = true),
										iconProps: {
											iconName: "Add",
										},
									},
							  ]
							: []
					}
				/>
				<Panel
					isOpen={this.showAdditionPanel}
					type={PanelType.smallFixedFar}
					closeButtonAriaLabel="Close"
					isLightDismiss={true}
					onDismiss={() => {
						this.showAdditionPanel = false;
					}}
				>
					<br />
					<TagInputComponent
						label={text("select patient").c}
						options={modules.patients!.docs.map((patient) => ({
							text: patient.name,
							key: patient._id,
						}))}
						className="choose-patient"
						suggestionsHeaderText={text("select patient").c}
						noResultsFoundText={text("no patient found").c}
						maxItems={1}
						disabled={!this.canEdit}
						value={[]}
						onChange={(selectedKeys) => {
							if (selectedKeys[0]) {
								this.showAdditionPanel = false;
								const orthoCase = modules.orthoCases!.new();
								orthoCase.patientID = selectedKeys[0];
								modules.orthoCases!.add(orthoCase);
								core.router.select({
									id: orthoCase._id,
									tab: "sheet",
								});
							}
						}}
					/>
					<Row className="m-t-15">
						<Col xs={10}>
							<hr />
						</Col>

						<Col xs={4}>
							<i className="new-or">or</i>
						</Col>
						<Col xs={10}>
							<hr />
						</Col>
					</Row>
					<TextField
						label={text("add new").c}
						placeholder={text(`patient name`).c}
						value={this.newPatientName}
						onChange={(e, v) => (this.newPatientName = v!)}
					/>
					<DefaultButton
						onClick={() => {
							const newPatient = modules.patients!.new();
							newPatient.name = this.newPatientName;
							newPatient.fromJSON(newPatient.toJSON()); // init. teeth
							modules.patients!.add(newPatient);

							const orthoCase = modules.orthoCases!.new();
							orthoCase.patientID = newPatient._id;
							modules.orthoCases!.add(orthoCase);

							this.newPatientName = "";
							core.router.select({
								id: orthoCase._id,
								tab: "details",
							});
						}}
						iconProps={{
							iconName: "add",
						}}
						text={text("add new").c}
					/>
				</Panel>

				<Panel
					isOpen={
						!!(
							this.selectedCase &&
							this.selectedPatient &&
							core.router.selectedTab
						)
					}
					type={PanelType.medium}
					closeButtonAriaLabel="Close"
					isLightDismiss={true}
					onDismiss={() => {
						core.router.unSelect();
					}}
					onRenderNavigation={() => {
						if (!this.selectedCase) {
							return <div />;
						}
						if (!this.selectedPatient) {
							return <div />;
						}
						return (
							<div className="panel-heading">
								<PanelTop
									title={this.selectedPatient!.name}
									type={text("orthodontic").c}
									onDismiss={() => core.router.unSelect()}
									avatar={
										this.selectedPatient!.avatar
											? imagesTable.table[
													this.selectedPatient!.avatar
											  ]
												? imagesTable.table[
														this.selectedPatient!
															.avatar
												  ]
												: imagesTable.fetchImage(
														this.selectedPatient!
															.avatar
												  )
											: undefined
									}
								/>
								<PanelTabs
									currentSelectedKey={core.router.selectedTab}
									onSelect={(key) => {
										core.router.select({ tab: key });
									}}
									items={this.tabs}
								/>
							</div>
						);
					}}
				>
					<div>
						{this.selectedCase && this.selectedPatient ? (
							<div className="ortho-single-component">
								{core.router.selectedTab === "details" ? (
									<PatientDetailsPanel
										patient={this.selectedPatient!}
										onChangeViewWhich={(key) =>
											core.router.select({ tab: key })
										}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "dental" ? (
									<DentalHistoryPanel
										patient={this.selectedPatient!}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "sheet" ? (
									<OrthoCaseSheetPanel
										orthoCase={this.selectedCase}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "archive" ? (
									<OrthoRecordsPanel
										orthoCase={this.selectedCase}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "gallery" ? (
									<OrthoGalleryPanel
										orthoCase={this.selectedCase}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "appointments" ? (
									<PatientAppointmentsPanel
										patient={this.selectedPatient}
									/>
								) : (
									""
								)}

								{core.router.selectedTab === "delete" ? (
									<div>
										<br />
										<MessageBar
											messageBarType={
												MessageBarType.warning
											}
										>
											{
												text(
													"orthodontic case will be deleted"
												).c
											}
										</MessageBar>
										<br />
										<PrimaryButton
											className="delete"
											iconProps={{
												iconName: "delete",
											}}
											text={text("delete").c}
											onClick={() => {
												modules.orthoCases!.delete(
													core.router.selectedID
												);
												core.router.unSelect();
											}}
										/>
									</div>
								) : (
									""
								)}
							</div>
						) : (
							""
						)}
					</div>
				</Panel>
				{this.selectedAppointment ? (
					<AppointmentEditorPanel
						appointment={this.selectedAppointment}
						onDismiss={() => (this.selectedAppointmentId = "")}
					/>
				) : (
					""
				)}
			</div>
		);
	}
}
