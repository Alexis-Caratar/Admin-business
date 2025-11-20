import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MenuIcon from "@mui/icons-material/Menu";
import Inventory2Icon from "@mui/icons-material/Inventory2";

export const iconMap: Record<string, React.ReactNode> = {
  PersonIcon: <PersonIcon />,
  StoreIcon: <StoreIcon />,
  MenuBookIcon: <MenuBookIcon />,
  ShoppingCartIcon: <ShoppingCartIcon />,
  Inventory2Icon:<Inventory2Icon/>,
  default: <MenuIcon />   // default
};
