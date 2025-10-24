import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled from 'styled-components';

/**
 * Virtualized List Component
 * Renders only visible items for optimal performance
 * Perfect for long lists (messages, conversations, posts)
 */

const Container = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const VirtualizedList = ({ 
  items = [], 
  itemHeight = 80,
  renderItem,
  onScroll,
  className,
  overscanCount = 5
}) => {
  
  const Row = useCallback(({ index, style }) => {
    const item = items[index];
    
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  }, [items, renderItem]);

  const handleScroll = useCallback(({ scrollDirection, scrollOffset }) => {
    if (onScroll) {
      onScroll({ scrollDirection, scrollOffset });
    }
  }, [onScroll]);

  if (items.length === 0) {
    return (
      <Container className={className}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          fontSize: '14px'
        }}>
          Không có dữ liệu
        </div>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            onScroll={handleScroll}
            overscanCount={overscanCount}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </Container>
  );
};

export default VirtualizedList;

