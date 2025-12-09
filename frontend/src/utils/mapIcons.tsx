import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MenuIcon from "@mui/icons-material/Menu";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CategoryIcon from "@mui/icons-material/Category";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";


export const iconMap: Record<string, React.ReactNode> = {
  PersonIcon: <PersonIcon />,
  StoreIcon: <StoreIcon />,
  MenuBookIcon: <MenuBookIcon />,
  ShoppingCartIcon: <ShoppingCartIcon />,
  Inventory2Icon:<Inventory2Icon/>,
  BusinessCenterIcon:<BusinessCenterIcon/>,
  CategoryIcon:<CategoryIcon/>,
  PointOfSaleIcon:<PointOfSaleIcon/>,
  default: <MenuIcon />   // default
};
