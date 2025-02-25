import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';

function SidebarComponent() {
  return (
    <Sidebar>
      <Menu
        menuItemStyles={{
          button: {
            [`&.active`]: {
              backgroundColor: '#13395e',
              color: '#b6c8d9',
            },
          },
        }}
      >
        <MenuItem>
          <Link to="/documentation">Documentation</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/calendar">Calendar</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/e-commerce">E-commerce</Link>
        </MenuItem>
      </Menu>
    </Sidebar>
  );
}

export default SidebarComponent;
