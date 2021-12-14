import { JB2APATREONDB } from "../databases/jb2a-patreon-database.js";
import { JB2AFREEDB } from "../databases/jb2a-free-database.js";
import { AAanimationData } from "../../aa-classes/animation-data.js";
import { aaColorMenu } from "../databases/jb2a-menu-options.js";
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export async function shieldSpell(handler, autoObject) {
    function moduleIncludes(test) {
        return !!game.modules.get(test);
    }
    let obj01 = moduleIncludes("jb2a_patreon") === true ? JB2APATREONDB : JB2AFREEDB;
    //let itemName = handler.convertedName;
    let globalDelay = game.settings.get("autoanimations", "globaldelay");
    await wait(globalDelay);

    async function buildShieldFile(jb2a, baseColor, variant, endeffect) {
        //const spellVariant = handler.spellVariant || "01";
        let color = baseColor;
        color = color.replace(/\s+/g, '');
        function random_item(items)
        {
        return items[Math.floor(Math.random()*items.length)];
        }
        color = color === "random" ? random_item(Object.keys(aaColorMenu.static.bless[variant])) : color;
        //const shieldVar = handler.options.shieldVar || "outro_fade";
    
        const file01 = `autoanimations.static.shieldspell.${variant}.${color}.intro`;
        const file02 = `autoanimations.static.shieldspell.${variant}.${color}.loop`;
        const file03 = `autoanimations.static.shieldspell.${variant}.${color}.${endeffect}`;
    
        const fileData = jb2a.static.shieldspell["01"]["blue"]["intro"];
        const metadata = await getVideoDimensionsOf(fileData);
    
        return { file01, file02, file03, metadata };
    }
    const data = {};
    if (autoObject) {
        const autoOverridden = handler.autoOverride?.enable
        Object.assign(data, autoObject);
        data.animation = data.animation || "";
        data.color = autoOverridden ? handler.autoOverride?.color : data.color;
        data.scale = autoOverridden ? handler.autoOverride?.scale : data.scale;
        data.variant = autoOverridden ? handler.autoOverride?.variant : data.variant;
        data.persistent =  autoOverridden ? handler.autoOverride?.persistent : data.addCTA;
        data.endeffect = autoOverridden ? handler.autoOverride?.endEffect : data.endeffect;
        data.itemAudio = {
            enable: data.enableSound || false,
            file: data.soundFile,
            volume: data.soundVolume || 0.25,
            delay: data.soundDelay || 0,
        }
    } else {
        data.animation = handler.animation;
        data.color = handler.color ?? "blue";
        data.scale = handler.scale ?? 1;
        data.below = handler.below;
        data.persistent = handler.persistent ?? false;
        data.endeffect = handler.options.shieldVar ?? "outro_fade";
        data.variant = handler.variant ?? "01";
        data.itemAudio = {
            enable: handler.allSounds?.items?.enable || false,
            file: handler.allSounds?.items?.file,
            volume: handler.allSounds?.items?.volume || 0.25,
            delay: handler.allSounds?.items?.delay || 0,
        }
    }

    const sourceToken = handler.actorToken;
    const onToken = await buildShieldFile(obj01, data.color, data.variant, data.endeffect);
    // builds Source Token file if Enabled, and pulls from flags if already set
    const sourceFX = await AAanimationData._sourceFX(handler, sourceToken);

    //let animWidth = onToken.metadata.width;
    const sourceScale = sourceToken.w;
    let scale = ((sourceScale / onToken.metadata.width) * 1.75) * data.scale
    const gridSize = canvas.grid.size;


    async function cast() {
            new Sequence("Automated Animations")
                .addSequence(sourceFX.sourceSeq)
                .sound()
                    .file(data.itemAudio.file)
                    .volume(data.itemAudio.volume)
                    .delay(data.itemAudio.delay)
                    .playIf(() => {
                        return data.itemAudio.enable && data.itemAudio.file;
                    })    
                .effect()
                    .file(onToken.file01)
                    .scale(scale)
                    .gridSize(gridSize)
                    .atLocation(sourceToken)
                    .belowTokens(data.below)
                    .waitUntilFinished(-500)        
                .effect()
                    .file(onToken.file02)
                    .scale(scale)
                    .gridSize(gridSize)
                    .atLocation(sourceToken)
                    .belowTokens(data.below)
                    .playIf(!data.persistent)
                    .fadeIn(300)
                    .fadeOut(300)
                    .waitUntilFinished(-500)
                .effect()
                    .file(onToken.file02)
                    .scale(scale)
                    .gridSize(gridSize)
                    .attachTo(sourceToken)
                    .belowTokens(data.below)
                    .playIf(data.persistent)
                    .persist()
                    .origin(handler.item.uuid)
                    .fadeIn(300)
                    .fadeOut(300)
                    .waitUntilFinished(-500)
                .effect()
                    .file(onToken.file03)
                    .scale(scale)
                    .gridSize(gridSize)
                    .belowTokens(data.below)
                    .atLocation(sourceToken)                          
                .play()
            //await wait(250)
    }
    cast()
}

function getVideoDimensionsOf(url) {
    return new Promise(resolve => {
        // create the video element
        const video = document.createElement('video');
        video.preload = "metadata";

        // place a listener on it
        video.addEventListener("loadedmetadata", function () {
            // retrieve dimensions
            const height = this.videoHeight;
            const width = this.videoWidth;
            const duration = this.duration
            // send back result
            resolve({ height, width, duration });
        }, false);
        video.src = url;

    });
}
