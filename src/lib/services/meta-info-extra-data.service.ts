import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoExtraDataService {
  private extraData: any = {};

  constructor() { }

  public getExtraData(name: string): any {
    return this.extraData[name];
  }

  public setExtraData(name: string, value: any) {
    return (this.extraData[name] = value);
  }

  public resetExtraData() {
    return (this.extraData[name] = {});
  }
}
