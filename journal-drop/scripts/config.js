Hooks.once('init', async function() {

    libWrapper.register("journal-drop", 'Note.prototype._onClickLeft2', JournalDrop._onClickLeft2, "WRAPPER");

});

Hooks.once('ready', async function() {

});

Hooks.on("getJournalSheetHeaderButtons", (journalEntry, headerButtons) => {
        headerButtons.unshift({
            label: "Split Drop",
            class: "journal-drop-split",
            icon: 'fas fa-cut',
            onclick: () => {
                JournalDrop.drop(journalEntry.object);
            }
        });
})