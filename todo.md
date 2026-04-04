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

- if noteblocks are back to back. it needs one tick repeater in between. or if it is playing multiplte notes on one track same time, it needs to split it to multiple tracks or rows. it is trying to play harmonics. in the visualization show harmonics noteblocks on top of each other, instead of in one line, because they should be played same time. visualization should represent the timeline of the track being played.

- schematic should take into account the delay at start when the track should start compared to track that starts first.

- schematic should visualize all the repeaters. like how many it needs minimum with what settings. there should be also option to use repeaters and redstone so that the tracks align in actual time horizontally.

- schematic showing harmonics should use vertical redstone lines to connect the noteblocks together on the left side of the harmonic.

- the track title box is not the same height as the actual track. it still needs to be kept separate from the track, so the playhead is accurate. move the track title above the track-box. make it not take so much height, use automatically just enough height for it. put title and the text "n notes" on same line and the mute-toggle button next to it on left side.

- make it so that pressing the track mute, will hide the track completelty, reducing rendering it.