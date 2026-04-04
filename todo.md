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

- schematic should take into account the delay at start when the track should start compared to track that starts first.

- schematic should visualize all the repeaters. like how many it needs minimum with what settings. there should be also option to use repeaters and redstone so that the tracks align in actual time horizontally.

- schematic showing harmonics should use vertical redstone lines to connect the noteblocks together on the left side of the harmonic.

- i think the horizontal scroll and play-head are not keeping up with the sounds playing of the song. they are not in sync.

- for schematic. add option to split the track in 4-tempo blocks. show 4 4-tempo blocks and then move on to the next one, by checking checkbox on top of the 4-tempo area. hide other 4-tempo block areas for visual clarity. add option to use other tempos too.

- for "combine all tracks into minimal lanes" try to optimize it. if there is much delay at start. branch of from other lane when you need to to reduce the delay, i.e. reduce the amount of repeaters needed.

- for schematic, combine instrument tracks together, use multiple lanes if the multiple notes are played same time to make harmonics. use vertical redstone to indicate this.

- add option to hide the noteblock on top of support block on the schematic.

- move panel components to their own folders under components-folder. split their sub components to separate files.

- simplify/reduce schematic options