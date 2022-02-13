export class TokenFlipConfig extends FormApplication{
      constructor(...args) {
    super(...args);

  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      title: game.i18n.localize("tokenflip.config.formapp.title"),
      id: `tokenflip`,
      template: `modules/tokenflip/templates/tokenflip.hbs`,
      resizable: true,
      width: 300,
      dragDrop: [{ dragSelector: null, dropSelector: null }],
    };
  }

  getData() {

    let faces = this.object.getFlag("tokenflip", "tokenfaces") ?? [];
    if (!faces.length) {
      faces = [
        {
          actorId: this.object.actor.id,
          img: this.object.data.img,
          id: randomID(20),
          scale: this.object.data.scale,
        },
      ];
      this.object.setFlag("tokenflip", "tokenfaces", faces);
    }

    return {
      actorsarray: game.actors.contents.map(a => ({ name: a.name, id: a.id })),
      tokenfaces: faces,
    };
  }

  async activateListeners(html) {
    super.activateListeners(html);
    this.element[0].querySelector("button#add").addEventListener("click", this._onAdd.bind(this));
    this.element[0].querySelector("input").addEventListener("change", this.saveData.bind(this));
    this.element.on("click","button.delete" , this._onDelete.bind(this));
    const width = (this.element[0].querySelector("select")?.offsetWidth ?? 0);
    if(width) this.setPosition({width: width + 160});
  }

  async _onDelete(e){
    $(e.currentTarget).closest("li").remove();
    await this.saveData();
    this.setPosition({height: "auto"});
  }

  async _onAdd(e){
    e.preventDefault();
    const data = this.object.getFlag("tokenflip", "tokenfaces") ?? [];
    const id = randomID(20);
    data.push({
      actorId: this.object.actor.id,
      img: this.object.data.img,
      id: id,
      scale: this.object.data.scale,
    });
    await this.object.setFlag("tokenflip", "tokenfaces", data);
    this.render(true);
    this.setPosition({height: "auto"});
  }

  close() {
    this.saveData();
    super.close();
  }

  async saveData() {
    const ul = this.element[0].querySelector("ul");
    //loop ul
    let data = [];
    for (const li of ul.children) {
      const actorId = li.querySelector(`select`).value;
      const img = li.querySelector(`input[class="image"]`).value;
      const id = li.id;
      const scale = parseFloat(li.querySelector(`input[name="scale"]`).value);
      data.push({ actorId, img, id, scale });
    }
    await this.object.setFlag("tokenflip", "tokenfaces", data);
  }
}