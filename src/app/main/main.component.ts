import {Component, Inject} from '@angular/core';
import {Router} from "@angular/router";
import {UserService} from "../services/UserService";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {RoomService} from "../services/RoomService";
import {environment, utils} from "../app.config";
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {ConfirmDialog} from "../util/confirmDialog/ConfirmDialog";

``

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  loggedInUser = environment.loggedInUser;
  private client: Client;
  activeTab = 'rooms';
  displayedColumns: string[] = ['name', 'minPeople', 'maxPeople', 'participants', 'description'];
  contacts: any[] = []
  tags: any[] = [];
  message: string;
  chats: any[] = [];
  dataSource = [];

  constructor(private dialog: MatDialog,
              private router: Router,
              private roomService: RoomService,
              private userService: UserService
  ) {
  }

  ngOnInit() {
    if (this.loggedInUser.nickname == null) {
      this.openProfileEditDialog();
    }
    this.loadRooms();
    this.toggleTabs('content-friends')
    this.toggleTabs('content-rooms')
    this.contacts = this.loggedInUser.contacts;
    console.log(this.contacts)
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
      this.client.subscribe(`/topic/user/${this.loggedInUser.id}`, message => {
        // this.messages.push(JSON.parse(message.body).result)
        const result = JSON.parse(message.body).result;
        console.log(result)
        console.log(result.message)
        if (result.type === environment.messageTypes.MESSAGE) {
          let chatInstance = this.findChat(result.user.id);
          if (chatInstance == null) {
            chatInstance = {contact: result.user, messages: [{user: result.user, message: result.message}]};
            this.chats.push(chatInstance);
          } else {
            chatInstance.messages.push({user: result.user, message: result.message})
            this.openChat(chatInstance, true);
            setTimeout(function () {
              const chatLog = chatInstance.chatDialog.children[0];
              chatLog.scrollTop = chatLog.scrollHeight + 1250;
            }, 200);
          }
        } else if (result.type === environment.messageTypes.INVITATION) {
          this.dialog.open(ConfirmDialog, {
            data: {
              title: 'Invite',
              text: `You've been invited by #${result.user.nickName}. Proceed?`
            }
          }).afterClosed().subscribe(confirmation => {
            if (confirmation.confirmed) {
              this.router.navigate(['room', result.message]);
            }
          });

        }

      });
    };

    this.client.onStompError = function (frame) {
      // Handle errors.
    };

    this.client.activate();

  }

  loadLoggedInUser() {
    this.userService.home().subscribe({
      next: response => {
        environment.loggedInUser = response.result
        this.loggedInUser = response.result
      }
    })
  }

  loadRooms() {
    this.roomService.listRoom(response => {
      this.dataSource = response.result
    }, null)
  }

  changeTab(tabId: string) {
    this.activeTab = tabId;
  }

  openRoomCreationDialog() {

    this.dialog.open(RoomCreationDialog, {
      width: '450px',
      height: '490px',
      data: {
        contacts: this.loggedInUser.contacts
      }
    }).afterClosed().subscribe(result => {
      console.log(result.roomData)
      if (result.refreshRoomsList) {
        this.loadRooms();
        const messageBody = JSON.stringify({
          userId: environment.loggedInUser.id,
          message: result.roomData.roomId,
          type: environment.messageTypes.INVITATION
        });
        for (let userId of result.roomData.inviteList) {
          this.client.publish({destination: `/app/user/${userId}`, body: messageBody});
        }
        this.router.navigate(['room', result.roomData.roomId]);
      }
    });
  }

  openProfileEditDialog() {
    this.dialog.open(UpdateProfileDialog, {
      width: '450px',
      height: '270px'
    }).afterClosed().subscribe(result => {
      if (result.refreshUser) {
        this.loadLoggedInUser()
      }
    });
  }

  addTagDialog() {
    console.log('test')
    this.dialog.open(AddTagDialog, {
      width: '450px',
      height: '190px'
    }).afterClosed().subscribe(result => {
      if (result.refreshUser) {
        this.loadLoggedInUser()
      }
    });
  }

  openRoom(row) {
    this.router.navigate(['room', row.id]);
  }

  toggleTabs(tabId) {
    let tabToEnable: any = document.getElementById(tabId);
    for (let tab of tabToEnable.parentElement.getElementsByClassName('item')) {
      tab.style.visibility = 'hidden';
      tab.style.opacity = 0;
    }
    tabToEnable.style.visibility = 'visible';
    tabToEnable.style.opacity = 1;
  }

  removeTag(tagId: any) {
    this.loggedInUser.tags = this.loggedInUser.tags.filter(tag => tag.id != tagId);
    this.userService.updateProfile({tagIdsToBeRemoved: [tagId]}, response => {
      console.log(response)
    }, null);
  }

  searchContacts(event: any) {
    const value = event.target.value;
    setTimeout(function () {
      if (value === event.target.value) {
        if (value != null && value.trim() !== '') {
          this.userService.searchContacts({nickName: value, start: 0, limit: 20}).subscribe({
            next: response => {
              this.contacts = response.result.result;
              console.log(this.contacts)
            }
          });
        } else {
          this.contacts = this.loggedInUser.contacts;
        }
      }
    }.bind(this), 300)
  }

  addContact(contact: any) {
    this.loggedInUser.contacts.push(contact)
    this.userService.addContact(contact.id).subscribe();
  }

  removeContact(contact: any) {
    this.loggedInUser.contacts = this.loggedInUser.contacts.filter(record => record != contact);
    console.log(this.loggedInUser.contacts)
    this.userService.removeContact(contact.id).subscribe();
  }

  isContact(contactId) {
    return this.loggedInUser.contacts.map(contact => contact.id).indexOf(contactId) !== -1;
  }


  toggleChat(chat, closeOthers) {
    const panel = chat.chatDialog;
    let toggled = chat.toggled;
    if (toggled) {
      panel.classList.remove('scale-in-br')
      panel.classList.add('scale-out-br')
    } else {
      panel.classList.remove('scale-out-br')
      panel.classList.add('scale-in-br')
      if (closeOthers) {
        for (let anotherChat of this.chats) {
          if (anotherChat != chat && anotherChat.toggled) {
            anotherChat.chatDialog.classList.remove('scale-in-br')
            anotherChat.chatDialog.classList.add('scale-out-br')
            anotherChat.toggled = false;
          }
        }
      }
      let messageField = utils.findElement(chat.chatDialog, 'itemId', 'chat-input-message');
      messageField.focus();
    }
    chat.toggled = !chat.toggled;
  }

  openChat(chat, closeOthers) {
    const panel = chat.chatDialog;
    let toggled = chat.toggled;
    if (!toggled) {
      panel.classList.remove('scale-out-br')
      panel.classList.add('scale-in-br')
      if (closeOthers) {
        for (let anotherChat of this.chats) {
          if (anotherChat != chat && anotherChat.toggled) {
            anotherChat.chatDialog.classList.remove('scale-in-br')
            anotherChat.chatDialog.classList.add('scale-out-br')
            anotherChat.toggled = false;
          }
        }
      }
      let messageField = utils.findElement(chat.chatDialog, 'itemId', 'chat-input-message');
      messageField.focus();
    }
    chat.toggled = !chat.toggled;
  }

  startChat(contact: any) {
    let chat = this.findChat(contact.id);
    if (chat == null) {
      this.chats.push({contact: contact, messages: []})
    } else {
      this.toggleChat(chat, true);
    }
  }

  getChatRightMargin(chat, chatDialog) {
    if (chatDialog != null && chat.chatDialog == null) {
      chat.chatDialog = chatDialog
      chat.toggled = false
      this.toggleChat(chat, chatDialog);
    }
    const index = this.chats.indexOf(chat);
    return ((index + 1) * 40) + 'px';
  }

  findChat(contactId) {
    for (let chat of this.chats) {
      if (chat.contact.id === contactId) {
        return chat;
      }
    }
  }

  sendMessage(event, chat) {
    event.preventDefault()
    chat.messages.push({
      user: {avatar: environment.loggedInUser.photoUrl, nickName: environment.loggedInUser.nickname},
      message: this.message
    })
    const messageBody = JSON.stringify({
      userId: environment.loggedInUser.id,
      message: this.message,
      type: environment.messageTypes.MESSAGE
    });
    this.client.publish({destination: `/app/user/${chat.contact.id}`, body: messageBody});
    this.message = '';

    setTimeout(function () {
      const chatLog = chat.chatDialog.children[0];
      chatLog.scrollTop = chatLog.scrollHeight + 1250;
    }, 200);
  }
}

@Component({
  selector: 'room-creation-dialog',
  templateUrl: 'room-creation-dialog.html',
  styleUrl: './main.component.scss'
})
export class RoomCreationDialog {
  roomData: any = {name: '', description: '', minPeople: 2, maxPeople: 6, password: '', inviteList: []}
  contacts: any[] = []
  initialContacts: any[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private roomService: RoomService,
    public dialogRef: MatDialogRef<RoomCreationDialog>
  ) {
  }

  ngOnInit() {
    console.log(this.data);
    for (let contact of this.data.contacts) {
      this.initialContacts.push(contact)
      this.contacts.push(contact)
    }
  }

  onNoClick(): void {
    this.dialogRef.close({
      refreshRoomsList: false
    });
  }

  saveRoom() {
    this.roomService.createRoom(this.roomData, response => {
      console.log(response)
      this.roomData.roomId = response.result;
      this.dialogRef.close({
        refreshRoomsList: true,
        roomData: this.roomData
      });
    }, null);
  }

  addToInviteList(contact) {
    if (this.initialContacts.indexOf(contact) === -1) {
      this.initialContacts.push(contact)
    }
    this.roomData.inviteList.push(contact.id);
  }

  removeFromInviteList(contact) {
    this.roomData.inviteList = this.roomData.inviteList.filter(record => record != contact.id);
  }

  isInvited(contactId) {
    return this.roomData.inviteList.indexOf(contactId) !== -1;
  }

  searchContacts(event: any) {
    const value = event.target.value;
    setTimeout(function () {
      if (value === event.target.value) {
        if (value != null && value.trim() !== '') {
          this.userService.searchContacts({nickName: value, start: 0, limit: 20}).subscribe({
            next: response => {
              this.contacts = response.result.result;
              console.log(this.contacts)
            }
          });
        } else {
          this.contacts = [];
          for (let contact of this.initialContacts) {
            this.contacts.push(contact)
          }
        }
      }
    }.bind(this), 300)
  }
}

@Component({
  selector: 'update-profile-dialog',
  templateUrl: 'update-profile-dialog.html',
})
export class UpdateProfileDialog {
  data: any = {name: environment.loggedInUser.name, nickName: environment.loggedInUser.nickname}

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<UpdateProfileDialog>
  ) {
  }

  ngOnInit() {
    console.log(environment.loggedInUser.name)
    this.data = {name: environment.loggedInUser.name, nickName: environment.loggedInUser.nickname}

  }

  onNoClick(): void {
    this.dialogRef.close({
      refreshUser: false
    });
  }

  saveRoom() {
    this.userService.updateProfile(this.data, response => {
      this.dialogRef.close({
        refreshUser: true
      });
    }, null);
  }
}

@Component({
  selector: 'add-tag-dialog',
  templateUrl: 'add-tag-dialog.html',
})
export class AddTagDialog {
  data: any = {tags: null}

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<AddTagDialog>
  ) {
  }

  onNoClick(): void {
    this.dialogRef.close({
      refreshUser: false
    });
  }

  updateTags() {
    this.data.tags = [this.data.tags];
    this.userService.updateProfile(this.data, response => {
      this.dialogRef.close({
        refreshUser: true
      });
    }, null);
  }
}
