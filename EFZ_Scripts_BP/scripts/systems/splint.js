import { InputPermissionCategory, system } from "@minecraft/server";
import { BROKEN_LEG_TAG, BROKEN_LEG_EFFECTS } from "../data/constants.js";

function restoreJump(player) {
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
    return;
  } catch {
    // Fall back to the command for older or restricted runtime behavior.
  }

  player.runCommandAsync("inputpermission set @s jump enabled").catch(() => {});
}

export function registerSplintSystem() {
  system.beforeEvents.startup.subscribe((event) => {
    event.itemComponentRegistry.registerCustomComponent("efz:splint", {
      onConsume: ({ source }) => {
        if (!source?.hasTag?.(BROKEN_LEG_TAG)) {
          source?.sendMessage?.("You do not have a broken leg.");
          return;
        }

        source.removeTag(BROKEN_LEG_TAG);
        source.removeEffect(BROKEN_LEG_EFFECTS.slowness.identifier);
        restoreJump(source);
        source.sendMessage("Your broken leg has been treated.");
      }
    });
  });
}
