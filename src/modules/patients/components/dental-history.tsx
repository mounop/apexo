import { text } from "@core";
import * as core from "@core";
import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import * as loadable from "react-loadable";
import {
	Col,
	PanelTabs,
	PanelTop,
	ProfileComponent,
	Row,
	SectionComponent,
} from "@common-components";
import {
	conditionToColor,
	Patient,
	StaffMember,
	ToothCondition,
} from "@modules";
import {
	Dropdown,
	Icon,
	IconButton,
	Panel,
	PanelType,
	Shimmer,
	Toggle,
} from "office-ui-fabric-react";

const EditableListComponent = loadable({
	loading: () => <Shimmer />,
	loader: async () =>
		(await import("common-components/editable-list")).EditableListComponent,
});

const TeethDeciduousChart = loadable({
	loader: async () =>
		(await import("modules/patients/components/teeth-deciduous"))
			.TeethDeciduousChart,
	loading: () => <Shimmer />,
});

const TeethPermanentChart = loadable({
	loader: async () =>
		(await import("modules/patients/components/teeth-permanent"))
			.TeethPermanentChart,
	loading: () => <Shimmer />,
});

@observer
export class DentalHistoryPanel extends React.Component<
	{
		patient: Patient;
	},
	{}
> {
	@observable viewChart: boolean = true;

	@computed get canEdit() {
		return core.user.currentUser!.canEditPatients;
	}

	render() {
		return (
			<div className="dental-history teeth m-t-10">
				<div>
					<Toggle
						defaultChecked={true}
						onText={text("view graphic chart").c}
						offText={text("view sorted table").c}
						onChange={(ev, newVal) => {
							this.viewChart = newVal!;
						}}
						className={"hidden-xs"}
					/>
					{this.viewChart ? (
						<div className="chart">
							<SectionComponent title={text(`permanent teeth`).h}>
								<TeethPermanentChart
									teeth={this.props.patient.teeth}
									onClick={(number) =>
										core.router.select({
											sub: number.toString(),
										})
									}
								/>
							</SectionComponent>
							<SectionComponent title={text(`deciduous teeth`).h}>
								<TeethDeciduousChart
									teeth={this.props.patient.teeth}
									onClick={(number) =>
										core.router.select({
											sub: number.toString(),
										})
									}
								/>
							</SectionComponent>
						</div>
					) : (
						<div className="tabulated">
							<SectionComponent title={text(`permanent teeth`).h}>
								<table className="permanent">
									<tbody>
										<tr>
											{[
												this.mapQuadrant(11, 18, true),
												this.mapQuadrant(21, 28, false),
											]}
										</tr>
										<tr>
											{[
												this.mapQuadrant(41, 48, true),
												this.mapQuadrant(31, 38, false),
											]}
										</tr>
									</tbody>
								</table>
							</SectionComponent>
							<SectionComponent title={text(`deciduous teeth`).h}>
								<table className="deciduous">
									<tbody>
										<tr>
											{[
												this.mapQuadrant(51, 55, true),
												this.mapQuadrant(61, 65, false),
											]}
										</tr>
										<tr>
											{[
												this.mapQuadrant(81, 85, true),
												this.mapQuadrant(71, 75, false),
											]}
										</tr>
									</tbody>
								</table>
							</SectionComponent>
						</div>
					)}
				</div>
				{this.props.patient.teeth[Number(core.router.selectedSub)] ? (
					<Panel
						isOpen={
							!!this.props.patient.teeth[
								Number(core.router.selectedSub)
							]
						}
						type={PanelType.smallFixedFar}
						closeButtonAriaLabel="Close"
						isLightDismiss={true}
						onDismiss={() => core.router.unSelectSub()}
						onRenderNavigation={() => {
							const tooth = this.props.patient.teeth[
								Number(core.router.selectedSub)
							];

							return (
								<div className="panel-heading panel-heading-tooth">
									<PanelTop
										title={`ISO: ${
											tooth ? tooth.ISO : ""
										} - Universal: ${
											tooth ? tooth.Universal : ""
										}`}
										type={tooth.Name}
										onDismiss={() =>
											core.router.unSelectSub()
										}
										initials={<Icon iconName="teeth" />}
										initialsColor={conditionToColor(
											tooth.condition
										)}
										square
									/>

									<PanelTabs
										currentSelectedKey={"details"}
										onSelect={() => {}}
										items={[
											{
												key: "details",
												icon: "teeth",
												title: text("tooth history").h,
											},
										]}
									/>
								</div>
							);
						}}
					>
						{this.props.patient.teeth[
							Number(core.router.selectedSub)
						] ? (
							<div className="tooth-details">
								<Dropdown
									label={text(`tooth condition`).c}
									onChange={(ev, newVal: any) => {
										this.props.patient.teeth[
											Number(core.router.selectedSub)
										].condition = newVal.key.toString();
										this.props.patient.saveToPouch();
									}}
									selectedKey={
										this.props.patient.teeth[
											Number(core.router.selectedSub)
										].condition
									}
									className="single-tooth-condition"
									options={Object.keys(ToothCondition).map(
										(c) => ({
											key: c,
											text: text(c as any).r,
										})
									)}
									disabled={!this.canEdit}
								/>
								<EditableListComponent
									label={text("tooth history").c}
									value={
										this.props.patient.teeth[
											Number(core.router.selectedSub)
										].notes
									}
									disabled={!this.canEdit}
									onChange={(e) => {
										this.props.patient.teeth[
											Number(core.router.selectedSub)
										].notes = e;
										this.props.patient.saveToPouch();
									}}
								/>
							</div>
						) : (
							""
						)}
					</Panel>
				) : (
					""
				)}
			</div>
		);
	}

	mapQuadrant(min: number, max: number, reverse: boolean) {
		let arr = this.props.patient.teeth;
		arr = arr.filter((tooth) => tooth.ISO >= min && tooth.ISO <= max);
		arr = reverse ? arr.reverse() : arr;
		return arr.map((tooth) => (
			<td
				key={"tooth" + tooth.ISO}
				style={{ background: conditionToColor(tooth.condition) }}
				onClick={() =>
					core.router.select({ sub: tooth.ISO.toString() })
				}
			>
				<span
					className="has-notes"
					style={tooth.notes.length ? {} : { display: "none" }}
				/>
				{tooth.ISO}
			</td>
		));
	}
}
