import { TokenFlipConfig } from "./formapp.js";
import { injectConfiguration } from "./config.js";
import { tokenRefresh } from "./module.js";

injectConfiguration();

Hooks.once('ready', async function() {
    game.tfc = TokenFlipConfig;

    libWrapper.register("tokenflip", "BasePlaceableHUD.prototype.clear", (wrapped) => {
        wrapped();
        Object.values(ui.windows).forEach(w => {
            if(w.id === "tokenflipmenu") w.close();
        })
    }, "WRAPPER");

    libWrapper.register("tokenflip", "CONFIG.Token.objectClass.prototype.refresh", tokenRefresh, "MIXED");

});