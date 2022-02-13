export function flip(token,id){

    const currentActor = token.actor.id
    const currentImg = token.data.img
    const currentScale = token.data.scale
    const faces = token.document.getFlag("tokenflip", "tokenfaces") ?? [];
    if(!faces.length) return;
    const currentFace = faces.find(f => f.img === currentImg && f.actorId === currentActor && f.scale === currentScale);
    const currentIndex = faces.indexOf(currentFace) > -1 ? faces.indexOf(currentFace) : 0;

    const nextFace = id ? faces.find(f => f.id === id) : faces[(currentIndex + 1) % faces.length];
    if(!nextFace) return;

    token.flipUser = game.user.id;

    token.document.update({
        flags: {
            tokenflip: {
                previousImg: currentImg,
                previousScale: {
                    x: token.icon.scale.x,
                    y: token.icon.scale.y
                },
                nextFace: nextFace
            }
        }
    })

}

Hooks.on("updateToken", (token,updates) => {
    if(updates.img) token.object.refresh();
    if(!updates.flags?.tokenflip?.nextFace) return;
    animate(token.object);
})

async function animate(token){

    let scale

    while(!scale){
    try{
        scale = token.icon.scale;
    }
    catch(e){}
    await wait(10);
    }

    const tex0 = await loadTexture(token.data.flags.tokenflip.previousImg, {fallback: CONST.DEFAULT_TOKEN});
    const tex1 = await loadTexture(token.data.flags.tokenflip.nextFace.img, {fallback: CONST.DEFAULT_TOKEN});

    const newScale = computeNewScale(token, tex1);

    const animation = {
        token: token,
        scaleFactor: 1,
        stage : 0,
        startImg : token.data.flags.tokenflip.previousImg,
        endImg : token.data.img,
        scaleX0 : token.data.flags.tokenflip.previousScale.x,
        scaleY0 : token.data.flags.tokenflip.previousScale.y,
        scaleX1 : newScale.x,
        scaleY1 : newScale.y,
        tex0: tex0,
        tex1: tex1,
        nextFace: token.data.flags.tokenflip.nextFace
    }

    if(!canvas.tokens.flipping || !Object.values(canvas.tokens.flipping).length){
        canvas.tokens.flipping = {};
        canvas.app.ticker.add(_tickerAnimation);
    }

    token.flipping = true;
    canvas.tokens.flipping[token.id] = animation;
    

}

async function wait(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function _tickerAnimation(delta){
    const flipSpeed = game.settings.get("tokenflip", "flipspeed") || 0.1;

    for(let [id,animation] of Object.entries(canvas.tokens.flipping)){
        if(!animation.token.icon || animation.token.data.img === animation.nextFace) continue;

        if(animation.stage === 0){
            animation.scaleFactor -= delta * flipSpeed;
            if(animation.scaleFactor <= 0) animation.scaleFactor = 0;
        }else{
            animation.scaleFactor += delta * flipSpeed;
            if(animation.scaleFactor >= 1) animation.scaleFactor = 1;
        }
        
        if(animation.scaleFactor === 0 && animation.stage === 0){
            animation.stage = 1;
        }


        if(animation.scaleFactor === 1 && animation.stage === 1){
            animation.token.flipping = false;
            if(animation.token.flipUser === game.user.id){
                animation.token.document.update({
                    img: animation.nextFace.img,
                    actorId: animation.nextFace.actorId,
                    scale: animation.nextFace.scale,
                })
            }   
            delete canvas.tokens.flipping[id];
        }

        try{
            if(animation.token?.icon?.scale) {
                const tex = animation.stage ? animation.tex1 : animation.tex0;
                animation.token.icon.texture = tex;
                const scaleX = animation.stage ? animation.scaleX1 : animation.scaleX0;
                const scaleY = animation.stage ? animation.scaleY1 : animation.scaleY0;
                animation.token.icon.scale.set(scaleX * animation.scaleFactor, scaleY);
                animation.token.icon.anchor.set(0.5, 0.5);
            }
        }catch(e){}
    }

    if(!Object.values(canvas.tokens.flipping).length){
        canvas.app.ticker.remove(_tickerAnimation);
    }
}

export function tokenRefresh(wrapped, ...args){
    if(this.flipping) return this;
    return wrapped(...args);


    let animation,tex,scaleX,scaleY;
    if(this.flipping){
        animation = canvas.tokens.flipping[this.id];
        tex = animation.stage ? animation.tex1 : animation.tex0;
        scaleX = animation.stage ? animation.scaleX1 : animation.scaleX0;
        scaleY = animation.stage ? animation.scaleY1 : animation.scaleY0;
        this.icon.texture = tex;
    }
    wrapped(...args);
    if(!this.flipping) return this;
    try{
        this.icon.texture = tex;
        this.icon.scale.set(scaleX * animation.scaleFactor, scaleY);
    }catch(e){}

}

function computeNewScale(token, tex){
    const newScale = token.data.flags.tokenflip.nextFace.scale ?? token.data.scale;
    const sprite = new PIXI.Sprite(tex);
    if (tex) {
      let aspect = tex.width / tex.height;
      const scale = sprite.scale;
      if (aspect >= 1) {
        sprite.width = token.w * newScale;
        scale.y = Number(scale.x);
      } else {
        sprite.height = token.h * newScale;
        scale.x = Number(scale.y);
      }
    }

    // Mirror horizontally or vertically
    sprite.scale.x = Math.abs(sprite.scale.x) * (token.data.mirrorX ? -1 : 1);
    sprite.scale.y = Math.abs(sprite.scale.y) * (token.data.mirrorY ? -1 : 1);

    return sprite.scale;
}