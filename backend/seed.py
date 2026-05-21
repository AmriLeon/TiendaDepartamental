from basededatos import SessionLocal, engine, Base
from modelos import Producto, Variante, Sucursal, Inventario, Usuario
from sqlalchemy import text
import bcrypt

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def poblar_base_de_datos():
    # Reiniciar la base de datos
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("DROP TABLE IF EXISTS pedidos_logistica;"))
        conn.execute(text("DROP TABLE IF EXISTS detalles_venta;"))
        conn.execute(text("DROP TABLE IF EXISTS ventas;"))
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
        print("Sembrando datos de prueba ampliados...")

        # 0. Crear Usuarios (Admin y Cliente de prueba)
        admin = Usuario(
            nombre_usuario="admin",
            correo="admin@edmirs.com",
            contrasena_hash=get_password_hash("admin123"),
            rol="admin"
        )
        cliente = Usuario(
            nombre_usuario="cliente1",
            correo="cliente@ejemplo.com",
            contrasena_hash=get_password_hash("cliente123"),
            rol="cliente"
        )
        db.add_all([admin, cliente])
        db.commit()

        # 1. Crear Sucursales
        sucursal_norte = Sucursal(nombre="Sucursal Norte", direccion="Av. Tecnológico 100")
        sucursal_sur = Sucursal(nombre="Sucursal Sur", direccion="Blvd. Revolución 500")
        db.add_all([sucursal_norte, sucursal_sur])
        db.commit() # Guardamos para que se generen los IDs

        # 2. Crear Productos Base por Categoría
        productos_base = [
            # Alimentos
            Producto(nombre="Arroz Blanco Premium", descripcion="Arroz de grano largo, 1kg", categoria="Alimentos", imagen="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Cereal de Chocolate", descripcion="Cereal crujiente sabor chocolate, 500g", categoria="Alimentos", imagen="https://images.unsplash.com/photo-1504305754058-2f08cad59a25?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Leche Entera", descripcion="Leche pasteurizada, 1 Litro", categoria="Alimentos", imagen="https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Pasta Spaghetti", descripcion="Pasta de trigo duro, 500g", categoria="Alimentos", imagen="https://images.unsplash.com/photo-1612891888365-728b74c0e353?auto=format&fit=crop&q=80&w=500"),
            
            # Deportes
            Producto(nombre="Balón de Fútbol Profesional", descripcion="Balón oficial tamaño 5", categoria="Deportes", imagen="https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Mancuernas Ajustables", descripcion="Set de mancuernas de 10kg a 25kg", categoria="Deportes", imagen="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Tenis Running Pro", descripcion="Calzado ligero para correr", categoria="Deportes", imagen="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500"),
            
            # Farmacia
            Producto(nombre="Multivitamínico Diario", descripcion="Frasco con 60 cápsulas", categoria="Farmacia", imagen="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Analgésico Forte", descripcion="Alivio rápido para dolor de cabeza, 20 tabs", categoria="Farmacia", imagen="https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Termómetro Digital", descripcion="Medición rápida y precisa", categoria="Farmacia", imagen="https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=500"),
            
            # Limpieza
            Producto(nombre="Detergente Multiusos", descripcion="Limpiador líquido aroma lavanda, 2L", categoria="Limpieza", imagen="https://images.unsplash.com/photo-1584820927498-cafe8c1c969b?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Jabón para Trastes", descripcion="Corta grasa con aroma a limón, 500ml", categoria="Limpieza", imagen="https://images.unsplash.com/photo-1628148914617-6d2c4d60c2b7?auto=format&fit=crop&q=80&w=500"),
            
            # Cuidado personal
            Producto(nombre="Shampoo Hidratante", descripcion="Con extracto de aloe vera, 750ml", categoria="Cuidado personal", imagen="https://images.unsplash.com/photo-1631730486784-5456119f69ae?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Crema Corporal", descripcion="Humectación intensiva 24h, 400ml", categoria="Cuidado personal", imagen="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=500"),
            
            # Mascotas
            Producto(nombre="Alimento Seco Perros", descripcion="Sabor carne y vegetales, 2kg", categoria="Mascotas", imagen="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Arena para Gatos", descripcion="Aglutinante con control de olores, 5kg", categoria="Mascotas", imagen="https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80&w=500"),
            
            # Bebidas
            Producto(nombre="Refresco de Cola", descripcion="Lata 355ml", categoria="Bebidas", imagen="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Agua Mineral", descripcion="Botella 1.5L", categoria="Bebidas", imagen="https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=500"),
            
            # Licores
            Producto(nombre="Vino Tinto Reserva", descripcion="Añejado 12 meses en barrica, 750ml", categoria="Licores", imagen="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Cerveza Artesanal IPA", descripcion="Cerveza clara estilo IPA, 355ml", categoria="Licores", imagen="https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=500"),
            
            # Electrodomésticos
            Producto(nombre="Microondas 1.1 p3", descripcion="Horno de microondas color plata", categoria="Electrodomésticos", imagen="https://images.unsplash.com/photo-1585659722983-39cb3ee7d472?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Licuadora Pro", descripcion="10 velocidades y vaso de vidrio", categoria="Electrodomésticos", imagen="https://images.unsplash.com/photo-1585659722983-39cb3ee7d472?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Cafetera de Goteo", descripcion="Capacidad para 12 tazas", categoria="Electrodomésticos", imagen="https://images.unsplash.com/photo-1520970014086-2208d157c9e4?auto=format&fit=crop&q=80&w=500"),
            
            # Pantallas y audio
            Producto(nombre="Smart TV 65 4K UHD", descripcion="Pantalla LED 4K con apps integradas", categoria="Pantallas y audio", imagen="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Barra de Sonido 2.1", descripcion="Sonido envolvente con subwoofer inalámbrico", categoria="Pantallas y audio", imagen="https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Audífonos Bluetooth ANC", descripcion="Cancelación de ruido activa, 30h batería", categoria="Pantallas y audio", imagen="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=500"),
            
            # Celulares
            Producto(nombre="iPhone 15 Pro", descripcion="256GB, Titanio Natural", categoria="Celulares", imagen="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Samsung Galaxy S24", descripcion="256GB, Phantom Black", categoria="Celulares", imagen="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=500"),
            Producto(nombre="Xiaomi Redmi Note 13", descripcion="128GB, Azul Hielo", categoria="Celulares", imagen="https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=500"),
        ]
        
        db.add_all(productos_base)
        db.commit()

        # 3. Crear Variantes
        variantes_base = [
            # Alimentos
            Variante(id_producto=productos_base[0].id_producto, sku="ALIM-ARR-1KG", talla="1kg", color="Blanco", material="N/A", precio_base=35.50),
            Variante(id_producto=productos_base[1].id_producto, sku="ALIM-CER-CHO", talla="500g", color="Café", material="N/A", precio_base=65.00),
            Variante(id_producto=productos_base[2].id_producto, sku="ALIM-LEC-ENT", talla="1L", color="Blanco", material="N/A", precio_base=28.00),
            Variante(id_producto=productos_base[3].id_producto, sku="ALIM-PAS-500", talla="500g", color="Amarillo", material="N/A", precio_base=18.50),
            
            # Deportes
            Variante(id_producto=productos_base[4].id_producto, sku="DEP-BAL-FUT", talla="5", color="Blanco/Negro", material="Sintético", precio_base=800.00),
            Variante(id_producto=productos_base[5].id_producto, sku="DEP-MAN-AJU", talla="25kg max", color="Negro", material="Acero", precio_base=2500.00),
            Variante(id_producto=productos_base[6].id_producto, sku="DEP-TEN-RUN", talla="27 MX", color="Azul", material="Malla", precio_base=1800.00),
            
            # Farmacia
            Variante(id_producto=productos_base[7].id_producto, sku="FAR-MUL-60", talla="60 caps", color="N/A", material="N/A", precio_base=250.00),
            Variante(id_producto=productos_base[8].id_producto, sku="FAR-ANA-20", talla="20 tabs", color="N/A", material="N/A", precio_base=85.00),
            Variante(id_producto=productos_base[9].id_producto, sku="FAR-TER-DIG", talla="Única", color="Blanco", material="Plástico", precio_base=120.00),
            
            # Limpieza
            Variante(id_producto=productos_base[10].id_producto, sku="LIM-DET-2L", talla="2L", color="Morado", material="Líquido", precio_base=145.00),
            Variante(id_producto=productos_base[11].id_producto, sku="LIM-JAB-500", talla="500ml", color="Verde", material="Líquido", precio_base=42.00),
            
            # Cuidado personal
            Variante(id_producto=productos_base[12].id_producto, sku="CUI-SHA-750", talla="750ml", color="Verde Claro", material="Líquido", precio_base=110.00),
            Variante(id_producto=productos_base[13].id_producto, sku="CUI-CRE-400", talla="400ml", color="Blanco", material="Crema", precio_base=95.00),
            
            # Mascotas
            Variante(id_producto=productos_base[14].id_producto, sku="MAS-ALI-PER", talla="2kg", color="Café", material="Seco", precio_base=220.00),
            Variante(id_producto=productos_base[15].id_producto, sku="MAS-ARE-GAT", talla="5kg", color="Gris", material="Arena", precio_base=180.00),
            
            # Bebidas
            Variante(id_producto=productos_base[16].id_producto, sku="BEB-COL-355", talla="355ml", color="Negro", material="Lata", precio_base=18.00),
            Variante(id_producto=productos_base[17].id_producto, sku="BEB-AGU-15", talla="1.5L", color="Transparente", material="PET", precio_base=22.00),
            
            # Licores
            Variante(id_producto=productos_base[18].id_producto, sku="LIC-VIN-TIN", talla="750ml", color="Rojo Rubí", material="Vidrio", precio_base=450.00),
            Variante(id_producto=productos_base[19].id_producto, sku="LIC-CER-IPA", talla="355ml", color="Ambar", material="Vidrio", precio_base=65.00),
            
            # Electrodomésticos
            Variante(id_producto=productos_base[20].id_producto, sku="ELE-MIC-11", talla="1.1 p3", color="Plata", material="Acero", precio_base=2100.00),
            Variante(id_producto=productos_base[21].id_producto, sku="ELE-LIC-PRO", talla="1.5L", color="Negro/Plata", material="Vidrio/Acero", precio_base=1500.00),
            Variante(id_producto=productos_base[22].id_producto, sku="ELE-CAF-12", talla="12 Tazas", color="Negro", material="Plástico/Vidrio", precio_base=850.00),
            
            # Pantallas y audio
            Variante(id_producto=productos_base[23].id_producto, sku="PAN-TV-65", talla="65 pulgadas", color="Negro", material="Plástico/Metal", precio_base=12500.00),
            Variante(id_producto=productos_base[24].id_producto, sku="PAN-BAR-21", talla="Estándar", color="Negro", material="Plástico", precio_base=3200.00),
            Variante(id_producto=productos_base[25].id_producto, sku="PAN-AUD-ANC", talla="Over-ear", color="Negro", material="Plástico/Piel", precio_base=4500.00),
            
            # Celulares
            Variante(id_producto=productos_base[26].id_producto, sku="CEL-IPH-15P", talla="6.1 pulgadas", color="Titanio", material="Titanio/Cristal", precio_base=23999.00),
            Variante(id_producto=productos_base[27].id_producto, sku="CEL-SAM-S24", talla="6.2 pulgadas", color="Negro", material="Aluminio/Cristal", precio_base=19999.00),
            Variante(id_producto=productos_base[28].id_producto, sku="CEL-XIA-N13", talla="6.67 pulgadas", color="Azul", material="Plástico/Cristal", precio_base=5500.00),
        ]
        
        db.add_all(variantes_base)
        db.commit()

        # 4. Crear Inventario (Distribuyendo en sucursales)
        inventarios = []
        for i, var in enumerate(variantes_base):
            # Sucursal Norte
            inventarios.append(
                Inventario(id_sucursal=sucursal_norte.id_sucursal, id_variante=var.id_variante, stock_actual=(15 + (i % 5)*5), punto_pedido=5)
            )
            # Sucursal Sur (para algunos productos)
            if i % 2 == 0:
                inventarios.append(
                    Inventario(id_sucursal=sucursal_sur.id_sucursal, id_variante=var.id_variante, stock_actual=(10 + (i % 3)*5), punto_pedido=4)
                )
        
        db.add_all(inventarios)
        db.commit()

        print("Datos de prueba insertados con éxito!")

    except Exception as e:
        print(f"Ocurrió un error: {e}")
        db.rollback() # Si algo falla, deshacemos los cambios por seguridad
    finally:
        db.close()

if __name__ == "__main__":
    poblar_base_de_datos()