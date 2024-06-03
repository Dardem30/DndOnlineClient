import { Injectable } from '@angular/core';

@Injectable()
export class WebcamService {

  constructor() { }

  async getMediaStream(): Promise<MediaStream> {
    try {
      const constraints = {
        video: true,
        audio: true
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.error('Could not get media stream', err);
      throw err;
    }
  }

}
