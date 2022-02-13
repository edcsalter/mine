class JournalDrop {
  constructor(journal, origin, tag) {
    this.journal = journal;
    this.origin = origin || { x: 0, y: 0 };
    this.cols = 5;
    this.tag = tag || this.getTag(journal.data.content);
    this.parsedContent = this.parseContent(journal.data.content);
    console.log(this.parsedContent);
    this.createJournals();
  }

  parseContent(content) {
    const splitTag = this.tag;
    //split the content removing atrrributes from the tags
    const splitContent = content.split(new RegExp(`<${splitTag}[^>]*>`, "g"));
    return splitContent.map((c) => {
      const split = c.split(new RegExp(`</${splitTag}>`, "g"));
      return {
        title: split[0],
        content: split[1],
        tag: splitTag,
      };
    });
  }

  createJournals() {
    const journalsData = [];
    let x = this.origin.x;
    let y = this.origin.y;
    let cols = 0;
    const grid = canvas.dimensions.size;
    for (const content of this.parsedContent) {
      if (!content.title || !content.content) continue;
      journalsData.push({
        entryId: this.journal.id,
        x: x,
        y: y,
        icon: "icons/svg/book.svg",
        iconSize: 40,
        iconTint: null,
        fontFamily: "Signika",
        fontSize: 48,
        textAnchor: 1,
        textColor: "#FFFFFF",
        text: content.title,
        flags: {
          "journal-drop": {
            title: content.title,
            content: content.content,
            tag: this.tag,
          },
        },
      });
      x += grid;
      cols++;
      if (cols >= this.cols) {
        y += grid;
        x = this.origin.x;
        cols = 0;
      }
    }
    canvas.scene.createEmbeddedDocuments("Note", journalsData);
  }

  getTag(content) {
    //determine the h tag with the highest number of occurences
    const tags = content.match(/<\/h[1-3]>/g);
    console.log(tags);
    if (!tags) return "h1";
    const tagCount = {};
    for (const tag of tags) {
      if (!tagCount[tag]) tagCount[tag] = 0;
      tagCount[tag]++;
    }
    const max = Object.keys(tagCount).reduce((a, b) => {
      return tagCount[a] > tagCount[b] ? a : b;
    });
    //return just the tag name
    console.log(max.replace(/<|>|\//g, ""));
    return max.replace(/<|>|\//g, "");

  }

  static scrollTo(element, title, tag) {
    // scroll to the h3 element that has title as text
    const splitTag = tag;
    const tags = $(element).find(splitTag);
    for (const tag of tags) {
      if (tag.textContent === title) {
        $(element)
          .find(".editor-content")
          .animate({
            scrollTop:
              $(tag).offset().top -
              $(element).find(".editor-content").offset().top +
              $(element).scrollTop(),
          });
        break;
      }
    }
  }

  static drop(journal){
    Dialog.confirm({
      title: "Drop Journal on map as separate pins?",
      content: `
      <section class="window-content">
      <div class="form-group">
        <label>Separator Tag</label>
        <div class="form-fields">
            <input type="text" id="html-tag" value="" placeholder="Leave empty for auto">
        </div>
    </div>
    </section>
      `,
      yes: (html) => {
        const center = {
          x: canvas.dimensions.width / 2,
          y: canvas.dimensions.height / 2,
        }
        const tag = html.find("#html-tag").val();
        new JournalDrop(journal, center, tag);
      }
    });
  }

 /* static _onClickLeft2(event) {
    let sheet;
    const title = this.data.flags["journal-drop"].title;
    if (this.entry) sheet = this.entry.sheet.render(true);
    setTimeout(() => {
      JournalDrop.scrollTo(
        sheet.element,
        title,
        this.data.flags["journal-drop"].tag
      );
    }, 0);
  }*/
  static _onClickLeft2(wrapped, ...args) {
    wrapped(...args);
    const title = this.data.flags["journal-drop"]?.title;
    if(title){
      Hooks.once("renderJournalSheet", () => {
        const sheet = Object.values(ui.windows).find(w => w.object?.id === this.data.entryId);
      if(sheet){
        JournalDrop.scrollTo(sheet.element, title, this.data.flags["journal-drop"].tag);
      }
      });      
    }
  }
}
