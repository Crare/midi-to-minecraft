# TODO

- github action to build and publish to crare.github.io/midi-to-minecraft
    - with audit and outdated checks
    - with tests run
- tests

- add option in the visualization to organize tracks to tracks per instrument. if multiple same instruments are played same time, then use multiple tracks for them. make sure the tracks stay synchronous. so if the note is played later, it needs to be taken to account where it actually should be played at. take into account also the option "remove empty space at the start of the song" how it will effect this.

- when playing the song, always change to synchronous alignment mode before starting to play the song if it is not in that mode.

- convert the app to typescript

- add visualization: compact mode, use less tracks as possible. only use multiple tracks if multiple notes are played same time. otherwise the repeaters are in similar to asynchronous mode.

- optimize the app

- try prod build

- add analytics with goatcounter

- show build schematic, topdown with the noteblocks instrument-block shown(dirt, stone, sand, etc.) with either tracks in separate lanes or combined to one. make own panel for this. it should prefer to go in straight line.