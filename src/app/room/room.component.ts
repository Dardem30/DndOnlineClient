import {Component, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WebcamService} from "../services/WebcamService";
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {environment} from "../app.config";
import {RoomService} from "../services/RoomService";
import {InputDialog} from "../util/inputDialog/InputDialog";
import {MatDialog} from "@angular/material/dialog";

declare var JitsiMeetJS: any;

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss', './room.component.css']
})
export class RoomComponent {
  @ViewChildren('videoElement') videoElements;
  @ViewChildren('audioElement') audioElements;
  private client: Client;
  private roomId: number;
  messages: any[] = [];
  participants: any = {};
  message: string;

  constructor(
    private dialog: MatDialog,
    private webcamService: WebcamService,
    private roomService: RoomService,
    private router: Router,
    private route: ActivatedRoute) {
  }

  ngAfterViewInit() {
    this.videoElements = this.videoElements.toArray();
    this.audioElements = this.audioElements.toArray();
    this.roomId = this.route.snapshot.params['id'];
    this.initRoom(null);
  }

  initRoom(password) {
    const scope = this;
    this.roomService.accessConversation({roomId: this.roomId, password: password},
      response => {
        console.log(response);
        if (!response.success) {
          this.dialog.open(InputDialog, {
            data: {
              title: 'Password',
              type: `password`
            }
          }).afterClosed().subscribe(input => {
            const password = input.input;
            this.initRoom(password)
          });
          return;
        }
        this.client = new Client({
          webSocketFactory: () => new SockJS(`${environment.serverUrl}room`, {withCredentials: true}, null),
          debug: function (str) {
            console.log(str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });


        this.client.onConnect = frame => {
          this.client.subscribe(`/topic/room/${this.roomId}`, message => {
            this.messages.push(JSON.parse(message.body).result)
            setTimeout(function () {
              const chatLog = document.getElementById('log')
              chatLog.scrollTop = chatLog.scrollHeight + 1250;
            }, 200)
          });
        };

        this.client.onStompError = function (frame) {
          // Handle errors.
        };

        this.client.activate();


        JitsiMeetJS.init()
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

        const jwtJitsiToken = response.result;
        console.log(jwtJitsiToken)
        let localRoomId = this.roomId;
        let localRoomService = this.roomService;
        let participants = this.participants;
        let videoElements = this.videoElements;
        let audioElements = this.audioElements;
        const options = {
          hosts: {
            domain: 'jitsi-rlukashenko-dnd.online',
            muc: 'conference.jitsi-rlukashenko-dnd.online'
          },
          serviceUrl: 'https://jitsi-rlukashenko-dnd.online/http-bind',
          clientNode: 'http://jitsi.org/jitsimeet',
          jwt: jwtJitsiToken
        };

        const jitsiConnection = new JitsiMeetJS.JitsiConnection(null, jwtJitsiToken, options);
        window.onbeforeunload = function () {
          localRoomService.disconnect(localRoomId);
          jitsiConnection.disconnect();
        }
        jitsiConnection.addEventListener(
          JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
          onConnectionSuccess);
        jitsiConnection.addEventListener(
          JitsiMeetJS.events.connection.CONNECTION_FAILED,
          onConnectionFailed);

        function onConnectionSuccess() {
          const confOptions = {openBridgeChannel: true};
          const conference = jitsiConnection.initJitsiConference(localRoomId, confOptions);
          conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, track => {
            if (participants[track.getParticipantId()] == null) {
              participants[track.getParticipantId()] = {
                videoEl: null,
                audioEl: null
              }
            }
            if (track.getType() === 'video' && participants[track.getParticipantId()].videoEl == null) {
              let videoElToFill;
              for (let videoEl of videoElements) {
                if (videoEl.nativeElement.readyState === 0) {
                  videoElToFill = videoEl.nativeElement;
                }
              }
              participants[track.getParticipantId()].videoEl = videoElToFill;
              track.attach(videoElToFill);
            }
            if (track.getType() === 'audio' && participants[track.getParticipantId()].audioEl == null) {
              let audioElToFill;
              for (let audioEl of audioElements) {
                if (audioEl.nativeElement.readyState === 0) {
                  audioElToFill = audioEl.nativeElement;
                }
              }
              participants[track.getParticipantId()].audioEl = audioElToFill;
              track.attach(audioElToFill);
            }
          });
          conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
            if (track.getType() === 'video') {
              track.detach(participants[track.getParticipantId()].videoEl);
              participants[track.getParticipantId()].videoEl = null;
            }
            if (track.getType() === 'audio') {
              console.log('removed audio')
              console.log(participants[track.getParticipantId()].audioEl)
              track.detach(participants[track.getParticipantId()].audioEl);
              participants[track.getParticipantId()].audioEl = null;
            }
          });
          let localTracks = JitsiMeetJS.createLocalTracks({devices: ['audio', 'video']})
            .then(localTracks => {
              localTracks.forEach(track => {
                conference.addTrack(track).then(() => {
                  console.log('Local track added successfully to the conference');
                }).catch(error => {
                  console.error(`Unable to add local track to the conference: ${error}`);
                });
              });
              conference.join();
              // // localTracks is an array of Jitsi LocalTrack instances
              // for(let index = 0; index < localTracks.length; index++) {
              //   localTracks[index].addEventListener(
              //     JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
              //     () => console.log('local track muted')
              //   );
              //   localTracks[index].addEventListener(
              //     JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
              //     () => console.log('local track stopped')
              //   );
              //   if (localTracks[index].getType() === 'video') {
              //     // Attach video track to a video element in the DOM
              //     localTracks[index].attach(document.getElementById('localVideo'));
              //   } else {
              //     // Attach audio track to an audio element in the DOM
              //     localTracks[index].attach(document.getElementById('localAudio'));
              //   }
              // }
            })
            .catch(error => {
              console.log('Error getting local tracks', error);
            });

        }

        function onConnectionFailed() {
          console.error('Connection failed!');
        }

        jitsiConnection.connect();
      }, null);
  }

  sendMessage(event) {
    event.preventDefault();
    const messageBody = JSON.stringify({userId: environment.loggedInUser.id, message: this.message});
    this.client.publish({destination: `/app/room/${this.roomId}`, body: messageBody});
    this.message = '';
  }
}
