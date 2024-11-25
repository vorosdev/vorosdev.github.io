---
title: Máquinas Virtuales Casi Nativas con KVM en Debian/Ubuntu
description: Descubre cómo instalar, configurar y utilizar KVM en Debian/Ubuntu para crear máquinas 
             virtuales de alto rendimiento con QEMU y libvirt.
author: Vor
date: 2024-11-16
categories: [Guides, Virtualization]
tags: [Virtualization, Linux, KVM, QEMU, Libvirt, Virt-manager]
image:
    path: /assets/img/posts/guides/linux/Linux-KVM-logo-transparent.webp
    alt: KVM Logo
---

# Máquinas Virtuales Casi Nativas con KVM en Debian/Ubuntu 

**¿Te gustaría aprovechar al máximo el poder de la virtualización en Linux?** En esta guía, aprenderás 
a configurar KVM para ejecutar máquinas virtuales de alto rendimiento en tu sistema Debian o Ubuntu.

---

## **¿Qué es KVM y cómo funciona?**

KVM (Kernel-based Virtual Machine) permite que Linux actúe como un hipervisor de tipo 1 (bare-metal). 
Esto significa que, a diferencia de otros sistemas de virtualización, KVM trabaja directamente sobre 
el hardware de tu máquina, ofreciendo un rendimiento casi nativo.

**Características clave:**
- Aprovecha los mismos recursos de administración que Linux: memoria, CPU, red, etc.
- Cada máquina virtual funciona como un proceso regular de Linux, completamente aislado.
- Es compatible con sistemas virtuales de hardware, incluidas CPUs, tarjetas de red, discos y más.

---

## **Instalación y configuración**

### **Paso 1: Instalar los paquetes necesarios**  
Esta guía está diseñada para sistemas basados en Debian/Ubuntu. Sin embargo, es compatible con cualquier 
distribución de Linux; solo será necesario buscar y adaptar los paquetes requeridos según tu distribución.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install qemu-kvm libvirt-clients bridge-utils virtinst libvirt-daemon-system
```

Esto incluye:
- **QEMU-KVM**: Herramienta principal para crear y gestionar máquinas virtuales.
- **libvirt**: Sistema eficiente para administrar máquinas virtuales.
- **virtinst**: Proporciona utilidades como `virt-install` para crear máquinas virtuales fácilmente.
- **bridge-utils**: Para configurar redes en tus máquinas virtuales.

### **Paso 2: Configurar las redes virtuales**
Para que las máquinas virtuales tengan acceso a Internet, puedes usar una red virtual con NAT o 
configurar una interfaz bridge.

#### Red virtual de tipo NAT:

```bash
# Verifica si hay redes disponibles
sudo virsh net-list              

# Inicia la red predeterminada si no está activa
sudo virsh net-start default     

# Configura la red para que inicie automáticamente con el sistema
sudo virsh net-autostart default 
```

#### Crear una interfaz bridge:

```bash
# Crear la interfaz bridge
nmcli connection add type bridge ifname br0

# Asignar una interfaz física al bridge
nmcli connection add type bridge-slave ifname eth0 master br0

# Configurar una IP estática
nmcli connection modify br0 ipv4.addresses 192.168.1.100/24 ipv4.method manual
nmcli connection modify br0 ipv6.method ignore  # Deshabilitar IPv6 si no lo usas

# Si prefieres usar DHCP (opcional)
nmcli connection modify br0 ipv4.method auto
nmcli connection modify br0 ipv6.method ignore

# Deshabilitar STP (o habilitarlo si es necesario)
nmcli connection modify br0 bridge.stp no

# Reducir el tiempo de forward delay
nmcli connection modify br0 bridge.forward-delay 0

# Activar el bridge
nmcli connection down "Wired connection 1"
nmcli connection up br0
```

# Extra: añadir br0 a virsh

Crea el siguiente archivo en /tmp/br0.xml y añade el siguiente contenido:

```xml
<network>
  <name>br0</name>
  <forward mode="bridge"/>
  <bridge name="br0" />
</network>
```

Luego ejecuta:

```bash
virsh net-define /tmp/br0.xml
virsh net-start br0
virsh net-autostart br0
virsh net-list --all
```

### **Paso 3: Agregar tu usuario al grupo `libvirt`**
```bash
sudo usermod -aG libvirt myuser
sudo systemctl restart libvirtd  # Reinicia el servicio de libvirt para aplicar los cambios
```

---

## **Usando virt-manager: Una interfaz gráfica para KVM**

Si prefieres una solución gráfica, **virt-manager** es una herramienta que proporciona una interfaz sencilla 
para crear, administrar y monitorear tus máquinas virtuales.

Instálalo con:

```bash
sudo apt install virt-manager
```

Una vez instalado, inícialo ejecutando:

```bash
virt-manager
```

---

## **Configuración y creación de una máquina virtual**

Con el entorno configurado, crear tu primera máquina virtual es muy sencillo:

1. **Abrir virt-manager:**  
   Ejecuta `virt-manager` desde tu terminal o menú de aplicaciones.

   ![Desktop View](assets/img/posts/guides/linux/KVM_Posts/open-virt-manager.png){: .normal }

2. **Añadir una nueva conexión:**  
   Haz clic en **"File"** y selecciona **"Add Connection"**. Luego, conecta con la configuración predeterminada.

   ![Desktop View](assets/img/posts/guides/linux/KVM_Posts/file-virt-manager.png){: .normal }

3. **Crear una nueva máquina virtual:**  
   Haz clic en el botón **"Nuevo"** y sigue el asistente:
   - Elige el medio de instalación (archivo ISO o red).
   - Configura los recursos asignados (CPU, RAM, disco).
   - Personaliza la red y otros ajustes según tus necesidades.

   ![Desktop View](assets/img/posts/guides/linux/KVM_Posts/create-vm-virt-manager.png){: .normal }

4. **Inicia la máquina virtual:**  
   Una vez creada e instalada, selecciona tu VM y haz clic en **"Iniciar"**.

---
