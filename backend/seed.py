from basededatos import SessionLocal, engine, Base
from modelos import Producto, Variante, Sucursal, Inventario, Usuario
from sqlalchemy import text
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def poblar_base_de_datos():
    # Reiniciar la base de datos
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("DROP TABLE IF EXISTS inventario;"))
        conn.execute(text("DROP TABLE IF EXISTS usuarios;"))
        conn.execute(text("DROP TABLE IF EXISTS sucursales;"))
        conn.execute(text("DROP TABLE IF EXISTS variantes;"))
        conn.execute(text("DROP TABLE IF EXISTS productos;"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    
    Base.metadata.create_all(bind=engine)

    # Abrimos una sesión con la BD
    db = SessionLocal()

    try:
        print("Sembrando datos de prueba...")

        # 0. Crear Usuarios (Admin y Cliente de prueba)
        admin = Usuario(
            nombre_usuario="admin",
            correo="admin@edmirs.com",
            contrasena_hash=pwd_context.hash("admin123"),
            rol="admin"
        )
        cliente = Usuario(
            nombre_usuario="cliente1",
            correo="cliente@ejemplo.com",
            contrasena_hash=pwd_context.hash("cliente123"),
            rol="cliente"
        )
        db.add_all([admin, cliente])
        db.commit()

        # 1. Crear Sucursales
        sucursal_norte = Sucursal(nombre="Sucursal Norte", direccion="Av. Tecnológico 100")
        sucursal_sur = Sucursal(nombre="Sucursal Sur", direccion="Blvd. Revolución 500")
        db.add_all([sucursal_norte, sucursal_sur])
        db.commit() # Guardamos para que se generen los IDs

        # 2. Crear Productos Base
        pantalon = Producto(nombre="Pantalón Denim Clásico", descripcion="Jeans ajustados", categoria="Ropa")
        perfume = Producto(nombre="Fragancia Nocturna", descripcion="Aroma amaderado", categoria="Perfumería")
        
        # Nuevos Departamentos y Productos
        tv = Producto(nombre="Smart TV 55 4K", descripcion="Televisor inteligente con resolución 4K", categoria="Electrónica")
        laptop = Producto(nombre="Laptop Pro 15", descripcion="Computadora portátil para profesionales", categoria="Electrónica")
        sofa = Producto(nombre="Sofá Seccional", descripcion="Sofá en L de tela suave", categoria="Hogar")
        licuadora = Producto(nombre="Licuadora de Alta Potencia", descripcion="Ideal para batidos y triturar hielo", categoria="Hogar")
        balon = Producto(nombre="Balón de Fútbol Profesional", descripcion="Balón oficial tamaño 5", categoria="Deportes")
        raqueta = Producto(nombre="Raqueta de Tenis Pro", descripcion="Raqueta ligera de fibra de carbono", categoria="Deportes")
        
        db.add_all([pantalon, perfume, tv, laptop, sofa, licuadora, balon, raqueta])
        db.commit()

        # 3. Crear Variantes (Requerimiento de Atributos Complejos)
        pantalon_azul_m = Variante(id_producto=pantalon.id_producto, sku="PANT-AZ-M", talla="M", color="Azul", material="Mezclilla", precio_base=599.00)
        pantalon_negro_l = Variante(id_producto=pantalon.id_producto, sku="PANT-NE-L", talla="L", color="Negro", material="Mezclilla", precio_base=599.00)
        perfume_100ml = Variante(id_producto=perfume.id_producto, sku="PERF-100", talla="100ml", color="N/A", material="Cristal", precio_base=1250.00)
        
        tv_55 = Variante(id_producto=tv.id_producto, sku="TV-55-4K", talla="55 pulgadas", color="Negro", material="Plástico/Metal", precio_base=8500.00)
        laptop_16gb = Variante(id_producto=laptop.id_producto, sku="LAP-PRO-16GB", talla="15 pulgadas", color="Gris Espacial", material="Aluminio", precio_base=25000.00)
        sofa_gris = Variante(id_producto=sofa.id_producto, sku="SOFA-SEC-GR", talla="Grande", color="Gris", material="Tela", precio_base=12000.00)
        licuadora_negra = Variante(id_producto=licuadora.id_producto, sku="LIC-POT-NE", talla="Estándar", color="Negro", material="Acero/Vidrio", precio_base=1500.00)
        balon_oficial = Variante(id_producto=balon.id_producto, sku="BAL-FUT-PRO", talla="5", color="Blanco/Negro", material="Sintético", precio_base=800.00)
        raqueta_pro = Variante(id_producto=raqueta.id_producto, sku="RAQ-TEN-PRO", talla="Estándar", color="Rojo/Negro", material="Fibra de Carbono", precio_base=3200.00)

        db.add_all([
            pantalon_azul_m, pantalon_negro_l, perfume_100ml,
            tv_55, laptop_16gb, sofa_gris, licuadora_negra, balon_oficial, raqueta_pro
        ])
        db.commit()

        # 4. Crear Inventario (Requerimiento de Sincronización y Alertas)
        # OJO: Dejamos el pantalón azul con stock de 2 para que detone tu "lista roja" de reabastecimiento (punto de pedido = 5)
        inv_1 = Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=pantalon_azul_m.id_variante, stock_actual=2, punto_pedido=5)
        inv_2 = Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=perfume_100ml.id_variante, stock_actual=15, punto_pedido=5)
        inv_3 = Inventario(id_sucursal=sucursal_sur.id_sucursal, id_variante=pantalon_negro_l.id_variante, stock_actual=8, punto_pedido=3)
        
        inv_4 = Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=tv_55.id_variante, stock_actual=10, punto_pedido=4)
        inv_5 = Inventario(id_sucursal=sucursal_sur.id_sucursal, id_variante=laptop_16gb.id_variante, stock_actual=5, punto_pedido=3)
        inv_6 = Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=sofa_gris.id_variante, stock_actual=3, punto_pedido=2)
        inv_7 = Inventario(id_sucursal=sucursal_sur.id_sucursal, id_variante=licuadora_negra.id_variante, stock_actual=12, punto_pedido=5)
        inv_8 = Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=balon_oficial.id_variante, stock_actual=20, punto_pedido=10)
        inv_9 = Inventario(id_sucursal=sucursal_sur.id_sucursal, id_variante=raqueta_pro.id_variante, stock_actual=4, punto_pedido=5) # Generará alerta
        
        db.add_all([inv_1, inv_2, inv_3, inv_4, inv_5, inv_6, inv_7, inv_8, inv_9])
        db.commit()

        print("Datos de prueba insertados con éxito!")

    except Exception as e:
        print(f"Ocurrió un error: {e}")
        db.rollback() # Si algo falla, deshacemos los cambios por seguridad
    finally:
        db.close()

if __name__ == "__main__":
    poblar_base_de_datos()