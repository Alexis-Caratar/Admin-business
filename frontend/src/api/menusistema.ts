import axios from "./axios";

export const getModulos = async (id_negocio: string, id_usuario: Number) => {
  try {
    console.log("id_negocio",id_negocio);
    
    const { data } = await axios.get("/menus_sistema", {
      params: { id_negocio, id_usuario },
    });
    return data;
  } catch (error) {
    console.error("Error al obtener módulos:", error);
    return [];
  }
};
