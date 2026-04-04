# TODO

- github action to build and publish to crare.github.io/midi-to-minecraft
    - with audit and outdated checks
    - with tests run
- tests

- convert the app to typescript

- optimize the app

- try prod build

- add analytics with goatcounter

- schematic should take into account the delay at start when the track should start compared to track that starts first.

- schematic showing harmonics should use vertical redstone lines to connect the noteblocks together on the left side of the harmonic.

- i think the horizontal scroll and play-head are not keeping up with the sounds playing of the song. they are not in sync.

- for schematic. add option to split the track in 4-tempo blocks. show 4 4-tempo blocks and then move on to the next one, by checking checkbox on top of the 4-tempo area. hide other 4-tempo block areas for visual clarity. add option to use other tempos too.

- in shcematic, the second row tooltip doesn't fit in the horizontal box, maybe use z-index to put the tooltips at top.

- in schematic instrument lane title, show the support block name too. show amount of blocks needed: redstone, repeaters, noteblocks, support blocks. show total amount of blocks needed in the top of the schematic. show raw resource amount too:
- noteblock is 4 wooden planks and 1 redstone dust. 
- repeater is 1 redstone dust, 3 stone blocks and 2 redstone torches. 
- redstone torches are 1 stick and one redstone dust. 
- 4 sticks come from 2 wooden planks. 
- 1 wooden log turns to 4 wooden planks.
- raw resources are wooden logs, redstone dust and stone blocks and also the required support block.
- redstone dust can be compacted to redstone blocks from 9 dusts.

- track visualization doesn't show the 4-tempo lines.

- in the visualization show track length in time and minecraft ticks.

- in the schematic, show the noteblock use amount on top of the block.

- splitting to multiple lanes still doesn't work correctly. t-junctions are on top of noteblocks. noteblocks should be moved one block further right.

there is some extra redstone at the start. there is no redstone where there should be, maybe the empty space in between is in wrong place or too long or the redstone should be after it.

for schematics. build the lanes per instrument. don't group by harmonics. build lanes simultaneously. build per 1 tick at a time. check if there is same instrument played same time, if so add split vertical column, meanind add column of redstone for each lane, even the other instruments. then add the noteblocks for each lane for that tick. split of the first lane again if there is multiple notes same time. kill of new lanes when there is same amount repeaters needed for the next note. killing of means end the lane. branch out again from the main lane.