_distance(x, y, z) -> sqrt(
    (x * x) + (y * y) + (z * z)
);

can_hear(x, y, z) ->
    _distance(x + 1, y, z) < 45
    && _distance(x - 1, y, z) < 45;

_find_start_point(x, y, z) -> ( 
    c_for(i = 0, i < 45 && can_hear(x, y, z), i += 1, (
        x += 1;
        z += 1;
    ));
    x = x - 1;
    z = z - 1;
    l(x, z);
);

_set_repeater(x, y, z, ...state) -> (
    set(x, y-1, z, 'smooth_stone_slab', 'type', 'top');
    set(x, y, z, 'repeater', state);
);

_set_dust(x, y, z) -> (
    set(x, y-1, z, 'smooth_stone_slab', 'type', 'top');
    set(x, y, z, 'redstone_wire');
);

_set_n_dust(x, y, z, dz, n_dust) -> (
    c_for(i = 0, i < n_dust, i += 1, (
        _set_dust(x, y, z);
        z += dz;
    ));
    z;
);

_set_maybe_repeater(x, y, z, delay, facing) -> (
    if (
        delay > 0,
        _set_repeater(x, y, z, 'facing', facing, 'delay', delay),
        _set_dust(x, y, z)
    );
);

_set_on_switch(x, y, z, dx, dy, dz) -> (
    set(
        x + dx,
        y + dy,
        z + dz,
        'polished_granite'
    );
    _set_repeater(
        x + dx,
        y + dy,
        z + dz + 1,
        'facing', 'south'
    );
    set(
        x + dx,
        y + dy,
        z + dz + 2,
        'observer', 'facing', 'south'
    );
    set(
        x + dx,
        y + dy,
        z + dz + 3,
        'note_block'
    );
    set(
        x + dx,
        y + dy + 1,
        z + dz + 3,
        'sea_lantern'
    );
    set(
        x + dx + 1,
        y + dy + 1,
        z + dz + 3,
        'observer', 'facing', 'east'
    );
    set(
        x + dx + 1,
        y + dy + 2,
        z + dz + 3,
        'sticky_piston', 'facing', 'down'
    );
    c_for(i = 0, i <= dz + 2, i += 1, (
        if(
            ((i % 15) == 14) && (i != dz + 2),
            _set_repeater(
                x + dx + 1, y + dy + 3, z + dz + 2 - i,
                'facing', 'north'
            ),
            _set_dust(
                x + dx + 1, y + dy + 3, z + dz + 2 - i
            );
        );
    ));
    c_for(i = 0, i < dx, i += 1, (
        if(
            (i % 16) == 0,
            _set_repeater(
                x + dx - i, y + dy + 3, z,
                'facing', 'west'
            ),
            _set_dust(
                x + dx - i, y + dy + 3, z
            )
        );
    ));
    set(x, y + dy + 3, z, 'redstone_lamp');
    set(x, y + dy + 4, z, 'warped_button', 'face', 'floor', 'facing', 'east');
);

_set_repeat_toggle(x, y, z, dx, dy, dz) -> (
    set(
        x + dx + 1,
        y + dy,
        z + dz + 4,
        'polished_granite'
    );
    set(
        x + dx + 2,
        y + dy,
        z + dz + 4,
        'sticky_piston', 'facing', 'west'
    );
    set(
        x + dx + 3,
        y + dy,
        z + dz + 4,
        'polished_granite'
    );
    set(
        x + dx + 3,
        y + dy + 1,
        z + dz + 4,
        'redstone_wire'
    );
    set(
        x + dx + 3,
        y + dy + 2,
        z + dz + 3,
        'redstone_block'
    );
    set(
        x + dx + 3,
        y + dy + 2,
        z + dz + 2,
        'sticky_piston', 'facing', 'south'
    );

    c_for(i = 0, i <= dz + 3, i += 1, (
        if(
            ((i % 15) == 14) && (i != dz + 2),
            _set_repeater(
                x + dx + 3, y + dy + 3, z + dz + 1 - i,
                'facing', 'north'
            ),
            _set_dust(
                x + dx + 3, y + dy + 3, z + dz + 1 - i
            );
        );
    ));
    c_for(i = 0, i < dx + 2, i += 1, (
        if(
            (i % 16) == 0,
            _set_repeater(x + dx + 2 - i, y + dy + 3, z - 2, 'facing', 'west'),
            _set_dust(x + dx + 2 - i, y + dy + 3, z - 2)
        );
    ));
    set(x, y + dy + 3, z - 2, 'redstone_lamp');
    set(x, y + dy + 4, z - 2, 'lever', 'face', 'floor', 'facing', 'east');
);

_set_note(x, y, z, note) -> (
    block = get(note, 'block');
    if(block == 'minecraft:sand', (
        set(
            x, y -2, z,
            'stone_brick_slab', 'type', 'top'
        );
    ));
    set(x, y - 1, z, block);
    set(
        x, y, z,
        'note_block',
        'note', get(note, 'note'),
        'instrument', get(note, 'instrument')
    );
);

_find_next_offset(x, y, z, delay, dx, dz) -> (
    n_repeaters = ceil(delay/4);
    try((
        if(
            can_hear(x, y, z + n_repeaters * dz),
            throw(l('straight'))
        );  
        c_for(i = 0, i < 10, i += 1, (
            if(
                can_hear(x + 3 * dx, y, z - max(1+i, n_repeaters - 2) * dz),
                throw(l('corner', i))
            );
        ));
        c_for(i = 0, i < 10, i += 1, (
            if(
                can_hear(x, y - 3, z - (n_repeaters + i) * dz),
                throw(l('down', i))
            );
        ));
        'out of earshot';
    ), _);
);

_set_straight_delay(x, y, z, delay, dz) -> (
    while(delay > 0, ceil(delay/4), (
        this_delay = min(delay, 4);
        _set_repeater(
            x, y, z,
            'facing', if(dz == -1, 'south', 'north'),
            'delay', this_delay
        );
        delay = delay - this_delay;
        z += dz;
    ));
    set(x, y, z, 'polished_granite');
    z;
);

_set_corner_delay(x, y, z, delay, dx, dz, n_dust) -> (
    dz = -1 * dz;

    _set_dust(x, y, z);
    x += dx;

    this_delay = min(delay, 4);
    facing = if(dx == -1, 'east', 'west');
    _set_repeater(
        x, y, z,
        'facing', facing,
        'delay', this_delay
    );
    x += dx;
    delay = delay - this_delay;

    this_delay = min(delay, 4);
    _set_maybe_repeater(
        x, y, z, this_delay, facing
    );
    x += dx;

    _set_dust(x, y, z);
    z += dz;

    if(
        delay <= 0, set(x, y, z, 'target'),
        z = _set_straight_delay(x, y, z, delay, dz)
    );

    z = _set_n_dust(x, y, z, dz, n_dust);
    set(x, y, z, 'polished_granite');
    l(x, z);
);

_set_down_delay(x, y, z, delay, dx, dz, n_dust) -> (
    y = y -2;
    set(x, y, z, 'polished_granite');
    set(x, y + 1, z, 'redstone_wire');
    y = y - 1;
    z += dz;
    set(x, y, z, 'polished_granite');
    set(x, y + 1, z, 'redstone_wire');
    x += dx;
    dz = -1 * dz;
    dx = -1 * dx;
    _set_dust(x, y, z);
    z += dz;
    _set_dust(x, y, z);
    x += dx;
    _set_dust(x, y, z);
    z += dz;
    z = _set_straight_delay(x, y, z, delay, dz);
    z = _set_n_dust(x, y, z, dz, n_dust);
    set(x, y, z, 'polished_granite');
    l(y, z);
);

build_song(x, y, z, name, offset_y) -> (
    start = _find_start_point(0, offset_y, 0);
    offset_x = get(start, 0);
    offset_z = get(start, 1);    
    _set_on_switch(x, y, z, offset_x, offset_y, offset_z);
    _set_repeat_toggle(x, y, z, offset_x, offset_y, offset_z);
    facing = 'south';
    dx = -1;
    dz = -1;
    song = read_file(name, 'shared_json');
    for(song, (
        note = _;
        index = i;
        if(
            get(note, 'redstoneTickDelay') == 0,
            (
                _set_note(
                    x + offset_x - 1,
                    y + offset_y,
                    z + offset_z,
                    note
                );
            ),
            (
                delay = get(note, 'redstoneTickDelay');
                next = _find_next_offset(
                    offset_x, offset_y, offset_z,
                    delay, dx, dz, 
                );
                if(
                    get(next, 0) == 'straight', (
                        offset_z = _set_straight_delay(x + offset_x, y + offset_y, z + offset_z + dz, delay, dz) - z;
                    ),
                    get(next, 0) == 'corner', (
                        new_pos = _set_corner_delay(x + offset_x, y + offset_y, z + offset_z + dz, delay, dx, dz, get(next, 1));
                        dz = -1 * dz;
                        offset_x = get(new_pos, 0) - x;
                        offset_z = get(new_pos, 1) - z;
                    ),
                    get(next, 0) == 'down', (
                        new_pos = _set_down_delay(x + offset_x, y + offset_y, z + offset_z, delay, dx, dz, get(next, 1));
                        dz = -1 * dz;
                        dx = -1 * dx;
                        offset_y = get(new_pos, 0) - y;
                        offset_z = get(new_pos, 1) - z;
                        
                    ),
                    exit(l(next, index, length(song)));
                );
                _set_note(
                    x + offset_x + 1,
                    y + offset_y,
                    z + offset_z,
                    note
                );
            )
        );
    ));
    length(song);
);
