import { Component, Host, h, Element, State, Prop} from '@stencil/core';
import { SchedulesApiFactory, Schedule, WaitingListEntry, AmbulanceWaitingListApiFactory, AmbulanceRoomsApiFactory, Room } from '../../api/ambulance-wl';

@Component({
  tag: 'schedule-manager',
  styleUrl: 'schedule-manager.css',
  shadow: true,
})
export class ScheduleManager {
  @Element() element: HTMLElement;
  @Prop() apiBase: string;
  @Prop() ambulanceId: string;
  @State() schedules: Schedule[];
  @State() newSchedule: Schedule = {id: '', patientId: '', roomId: '', note: '', start: '', end: ''};
  @State() editorMode: boolean = false;
  @State() editedSchedule: Schedule;
  @State() patients: WaitingListEntry[];
  @State() rooms: Room[];

  // private async getConditions(): Promise<Schedule[]> {
  //   let local_rooms: Room[];

  //   try {
  //      const response = await AmbulanceRoomsApiFactory(undefined, this.apiBase).getRooms(this.ambulanceId);
  //      if (response.status < 299) {
  //      local_rooms = response.data;
  //      }
  //   } catch (err: any) {
  //      // no strong dependency on conditions
  //       console.error(`Cannot retrieve list of rooms: ${err.message || "unknown"}`);
  //   }
  //   // always have some fallback condition
  //   return local_rooms || [
  //     { id: "1", width: "10", height: "10", tipicalCostToOperate: 100 },
  //     { id: "2", width: "15", height: "12", tipicalCostToOperate: 105 }
  //   ];
  // }

  private async createSchedule(schedule: Schedule): Promise<Schedule> {
    try {
      const response = await SchedulesApiFactory(undefined, this.apiBase).createSchedule(this.ambulanceId, schedule);
      if (response.status < 299) {
        this.schedules = [...this.schedules, response.data];
        return response.data;
      } else {
        console.error(`Cannot create schedule: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error(`Cannot create schedule: ${err.message || "unknown"}`);
    }
    return undefined;
  }

  private async generateSchedule(){
    // let id_element = this.element.shadowRoot.querySelector('input[name="new_room_id"]') as HTMLInputElement;
    // let width_element = this.element.shadowRoot.querySelector('input[name="new_room_width"]') as HTMLInputElement;
    // let height_element = this.element.shadowRoot.querySelector('input[name="new_room_height"]') as HTMLInputElement;
    // let tipicalCostToOperate_element = this.element.shadowRoot.querySelector('input[name="new_room_costph"]') as HTMLInputElement;

    // const newRoom = {
    //   id: id_element.value,
    //   width: width_element.value,
    //   height: height_element.value,
    //   tipicalCostToOperate: parseInt(tipicalCostToOperate_element.value)
    // }


    // const tcoph = parseInt(this.newRoom.tipicalCostToOperate);

    const created_schedule = {
      id: this.newSchedule.id,
      patientId: this.newSchedule.patientId,
      roomId: this.newSchedule.roomId,
      note: this.newSchedule.note,
      start: this.newSchedule.start,
      end: this.newSchedule.end,
    }
    console.log("Creating schedule", created_schedule);


    this.createSchedule(created_schedule);
  }

  private async editSchedule(scheduleId: string){
    const filteredSchedules = this.schedules.filter(schedule => schedule.id === scheduleId);
    this.editedSchedule= filteredSchedules.length > 0 ? filteredSchedules[0] : null;

    this.editorMode = true
  }

  private async deleteSchedule(scheduleId: string){
    try {
      const response = await SchedulesApiFactory(undefined, this.apiBase).deleteSchedule(scheduleId, this.ambulanceId);
      if (response.status < 299) {
        this.schedules = this.schedules.filter(schedule => schedule.id !== scheduleId);
      } else {
        console.error(`Cannot delete schedule: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error(`Cannot delete schedule: ${err.message || "unknown"}`);
    }
  }


  async componentWillLoad() {
    // this.getConditions();
    const response = await SchedulesApiFactory(undefined, this.apiBase).getSchedules(this.ambulanceId);
    this.schedules = response.data;
    const response1 = await AmbulanceWaitingListApiFactory(undefined, this.apiBase).getWaitingListEntries(this.ambulanceId);
    this.patients = response1.data;
    const response2 = await AmbulanceRoomsApiFactory(undefined, this.apiBase).getRooms(this.ambulanceId);
    this.rooms = response2.data;
  }

  handleInputChange(event: Event, field: string) {
    console.log("setting field", field)

    const target = event.target as HTMLInputElement;
    console.log("setting value", target.value)
    this.newSchedule = {
      ...this.newSchedule,
      [field]: target.value
    };
  }

  componentDidLoad() {
    const tabs = this.element.shadowRoot.querySelectorAll('.mdc-tab');
    const tab_windows = this.element.shadowRoot.querySelectorAll('.tab_window');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('mdc-tab--active'));
        tab.classList.add('mdc-tab--active');

        tab_windows.forEach(tw => {tw.classList.remove('active_tab')});
        this.element.shadowRoot.getElementById(tab.innerHTML).classList.add('active_tab');
      });
    });
  }


  render() {
    return (
      <Host>
        <slot>
          <h1>
            Schedule manager
          </h1>
          <p>
            Schdule manager is a tool to manage reservations per room.
          </p>
          <div class="tabSelector">
            <div class="mdc-tab-bar" role="tablist">
              <label class="mdc-tab mdc-tab--active" role="tab" id="tab1-tab" tabindex="0" htmlFor="tab1-radio">Reservations</label>
              <label class="mdc-tab" role="tab" id="tab2-tab" tabindex="0" htmlFor="tab2-radio">Manage</label>
            </div>
            <input class="mdc-tab-radio" type="radio" name="tab" id="tab1-radio" checked />
            <input class="mdc-tab-radio" type="radio" name="tab" id="tab2-radio" />
          </div>
          <md-list id="Reservations" class="tab_window active_tab">
            {this.schedules.length > 0 && this.schedules.map((schedule) =>
            <md-list-item class="room-item-list">
              <div class="item-details">
                <div>ID: <span>{schedule.id}</span></div>
                <div>PatientId: <span>{schedule.patientId}</span></div>
                <div>RoomId: <span>{schedule.roomId}</span></div>
                <div>Note: <span>{schedule.note}</span></div>
                <div>Start: <span>{schedule.start}</span></div>
                <div>End: <span>{schedule.end}</span></div>
              </div>
              <md-icon slot="start">D</md-icon>

              <md-button slot="end" onClick={() => this.editSchedule(schedule.id) }><md-icon slot="icon">edit</md-icon></md-button>
              <md-button slot="end" onClick={() => this.deleteSchedule(schedule.id) }><md-icon slot="icon">delete</md-icon></md-button>
            </md-list-item>
          )}
          </md-list>
          <div id="Manage" class="tab_window">
            <p><b>Create new reservation</b></p>
            <div class="form">
              <md-filled-text-field
                label="New reservation id..."
                name="new_room_id"
                required
                value={this.newSchedule.id}
                onInput={(event) => this.handleInputChange(event, 'id')}
              />
              {/* <md-filled-text-field
                label="New schedule patient id..."
                name="new_patientid"
                required
                value={this.newSchedule.patientId}
                onInput={(event) => this.handleInputChange(event, 'patientId')}
              /> */}
              <div class="specialSelector">
                <label htmlFor="patientSelect">Select Patient: </label>
                <select
                  id="patientSelect"
                  name="new_patientid"
                  required
                  // value={this.newSchedule.patientId}
                  onInput={(event) => this.handleInputChange(event, 'patientId')}
                >
                  <option value="" disabled>
                    Select a patient...
                  </option>
                  {this.patients.map(patient => (
                    <option value={patient.id} key={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* <md-filled-text-field
                label="New schedule room id..."
                name="new_roomid"
                required
                value={this.newSchedule.roomId}
                onInput={(event) => this.handleInputChange(event, 'roomId')}
              /> */}
              <div class="specialSelector">
                <label htmlFor="roomSelect">Select Room: </label>
                <select
                  id="roomSelect"
                  name="new_roomid"
                  required
                  // value={this.newSchedule.patientId}
                  onInput={(event) => this.handleInputChange(event, 'roomId')}
                >
                  <option value="" disabled>
                    Select a room...
                  </option>
                  {this.rooms.map(room => (
                    <option value={room.id} key={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <md-filled-text-field
                label="New schedule note..."
                name="new_note"
                required
                value={this.newSchedule.note}
                onInput={(event) => this.handleInputChange(event, 'note')}
              />
              <md-filled-text-field
                label="New schedule start time..."
                name="new_start"
                required
                value={this.newSchedule.start}
                onInput={(event) => this.handleInputChange(event, 'start')}
              />
              <md-filled-text-field
                label="New schedule end time..."
                name="new_end"
                required
                value={this.newSchedule.end}
                onInput={(event) => this.handleInputChange(event, 'end')}
              />
            </div>

            {/* <button onClick={() => this.generateRoom()}>Save</button> */}
            <md-filled-button
              onClick={() => this.generateSchedule() }
              >
              <md-icon slot="icon">Save</md-icon>
              Save
          </md-filled-button>
          </div>
        </slot>
      </Host>
    );
  }

}
