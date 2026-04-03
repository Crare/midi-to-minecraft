# TODO

- github action to build and publish to crare.github.io/midi-to-minecraft
    - with audit and outdated checks
    - with tests run
- tests
- visualization

- split the components to separate files.

- add option in the visualization to organize tracks to tracks per instrument. if multiple same instruments are played same time, then use multiple tracks for them. make sure the tracks stay synchronous. so if the note is played later, it needs to be taken to account where it actually should be played at. take into account also the option "remove empty space at the start of the song" how it will effect this.

- simulate the song play. option to play single track or all the tracks. show vertical line going across the track. make the line draggable. when dragged it changes the play position. allow starting and stopping the play of the tracks with play and stop buttons. add button to start from the beginning.



repeaters have delay settings:
Setting	Delay
1st	2 game ticks (0.1 seconds)
2nd	4 game ticks (0.2 seconds)
3rd	6 game ticks (0.3 seconds)
4th	8 game ticks (0.4 seconds)

take this into account when visualizing repeaters with "accurate amount needed"
you need 4 visually different images for the repeater for this.


show build schematic, topdown with the noteblocks instrument-block shown(dirt, stone, sand, etc.) with either tracks in separate lanes or combined to one. make own panel for this. it should prefer to go in straight line.

when playing the song, always change to synchronous alignment mode before starting to play the song if it is not in that mode.


convert the app to typescript

add visualization: compact mode, use less tracks as possible. only use multiple tracks if multiple notes are played same time. otherwise the repeaters are in similar to asynchronous mode.


optimize the app

try prod build