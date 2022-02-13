class JDTooltip {
  constructor(object) {
    this.object = object;
    this.element = $(
      `<div class="jd-tooltip jd-tooltip-hover">
      <i class="fas fa-lock-open"></i>
      <div class="jd-tooltip-content"></div></div>`
    );
    this.element.appendTo("body");
    this.loadData();
    this.activateListeners(this.element);
    this.setPosition();
    this.element.fadeOut(0);
    this.element.fadeIn(500);
    canvas.hud.JDTooltip[this.object.id] = this;
  }

  activateListeners(html) {
    const _this = this;
    //add a class on mouse over
    html.on("mouseover", () => {
      html.addClass("jd-tooltip-hover");
    });
    //remove element on mouse out
    html.on("mouseout", () => {
      html.removeClass("jd-tooltip-hover");
      setTimeout(() => {
        if (
          !html.hasClass("jd-tooltip-hover") &&
          !html.hasClass("jd-tooltip-locked")
        ) {
          html.remove();
          delete canvas.hud.JDTooltip[this.object.id];
        }
      }, 200);
    });
    //add class on click of fa-lock
    html.find(".fas").on("click", (e) => {
      $(e.currentTarget).toggleClass("fa-lock fa-lock-open");
      html.toggleClass("jd-tooltip-locked");
    });
  }

  loadData() {
    const content = this.object?.data?.flags["journal-drop"]?.content;
    if (!content) {
      this.element.remove();
      return;
    }
    this.element.find(".jd-tooltip-content").html(content);
  }

  setPosition() {
    const x = this.object.center.x + this.object.controlIcon.width;
    const y = this.object.center.y;
    const t = canvas.stage.worldTransform;
    const screenX = t.tx + x * canvas.stage.scale.x;
    const screenY = t.ty + y * canvas.stage.scale.y;
    //get element height
    this.element.css({
      left: screenX,
      top: screenY - this.element.height() / 2,
    });
  }
}

Hooks.on("hoverNote", (object, hovered) => {
  if(!game.user.isGM) return;
  if (hovered && canvas.hud?.JDTooltip?.toggleTooltips) {
    new JDTooltip(object);
  } else {
    const html = canvas.hud.JDTooltip[object.id]?.element;
    if(!html) return;
    html.removeClass("jd-tooltip-hover");
    setTimeout(() => {
      if (
        !html.hasClass("jd-tooltip-hover") &&
        !html.hasClass("jd-tooltip-locked")
      ) {
        html.remove();
        delete canvas.hud.JDTooltip[object.id];
      }
    }, 200);
  }
});

Hooks.on("canvasPan", () => {
  if (!game.user.isGM) return;
  if (canvas.hud.JDTooltip) {
    for (const tooltip of Object.values(canvas.hud.JDTooltip)) {
      if(tooltip?.object) tooltip.setPosition();
    }
  }
});

Hooks.on("canvasReady", () => {
  if (!game.user.isGM) return;
  canvas.hud.JDTooltip = {};
});

Hooks.on("getSceneControlButtons", (controls) => {

  controls.find(c => c.name === "notes").tools.push(
    {
      "name": "toggle-tooltips",
      "title": "Toggle Tooltips",
      "icon": "fas fa-align-justify",
      "toggle": true,
      "active": false,
      onClick: (toggle) => {
        canvas.hud.JDTooltip.toggleTooltips = toggle;
      },
    }
  );
})