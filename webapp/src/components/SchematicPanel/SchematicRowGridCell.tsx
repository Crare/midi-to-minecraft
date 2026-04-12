import { RedstoneDustCell } from '@components/common/cells/RedstoneDustCell';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { AnchorCell, SegmentRepeaterCell } from './SchematicCells';

// Cell renderer for react-window Grid
export function SchematicRowGridCell({ columnIndex, rowIndex, style, cellProps }: any) {
  // console.log('SchematicRowGridCell, cellProps', cellProps);
  if (!cellProps) return null;
  const {
    getRowByIndex,
    anchors,
    cs,
    onColumnClick,
    onRowClick,
    lastPressed,
    setLastPressed,
    currentTick,
  } = cellProps;
  const item = getRowByIndex(rowIndex);
  if (!item) return null;
  const { inst, row } = item;
  if (columnIndex === 0) {
    return (
      <Box
        style={style}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}
      >
        <Button
          variant="contained"
          size="small"
          sx={{
            minWidth: cs,
            minHeight: cs,
            width: cs,
            height: cs,
            bgcolor: '#3d5f22',
            color: '#fff',
            p: 0,
            borderRadius: 1,
            '&:hover': { bgcolor: '#49732a' },
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRowClick?.(e.currentTarget);
          }}
          aria-label="Move row marker here"
        >
          <RedstoneDustCell size={cs} />
        </Button>
      </Box>
    );
  }
  // Each anchor has two columns: segment and anchor
  const anchorIdx = Math.floor((columnIndex - 1) / 2);
  if ((columnIndex - 1) % 2 === 0) {
    // Segment column
    const seg = row.segments[anchorIdx] ?? [];
    return (
      <Box
        style={style}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {seg.map((cell: any, ri: number) =>
            cell.kind === 'dust' ? (
              <RedstoneDustCell key={ri} size={cs} />
            ) : (
              <SegmentRepeaterCell key={ri} cell={cell} cs={cs} />
            ),
          )}
        </Box>
      </Box>
    );
  } else {
    // Anchor cell
    return (
      <Box
        style={style}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}
      >
        <AnchorCell
          anchor={anchors[anchorIdx]}
          cell={row.anchorCells[anchorIdx]}
          cs={cs}
          instrument={inst.label}
          block={inst.block}
          isLastPressed={lastPressed === `${row.id}:${anchorIdx}`}
          onPress={() => setLastPressed(`${row.id}:${anchorIdx}`)}
        />
      </Box>
    );
  }
}
