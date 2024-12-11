---
title: Cómo Convertir Máquinas Virtuales de VMware o VirtualBox a QEMU/KVM  
description: Aprende a migrar tus máquinas virtuales de VMware o VirtualBox al formato QCOW2, compatible con QEMU/KVM.  
author: Vor  
date: 2024-12-10  
categories: [Guías, Virtualización]  
tags: [Virtualización, Linux, KVM, QEMU, Libvirt, Virt-Manager, VMware, VirtualBox]  
image:
    path: /assets/img/posts/guides/linux/Linux-KVM-logo-transparent.webp  
    alt: Logo de KVM  

---

# Cómo Migrar Máquinas Virtuales de VMware o VirtualBox a QEMU/KVM  

En esta guía aprenderás a migrar máquinas virtuales de plataformas como VMware, VirtualBox o Hyper-V al formato QCOW2, totalmente compatible con QEMU/KVM y herramientas como Virt-Manager.  

--- 

## **Requisitos para Comenzar**

1. **Máquina Virtual a Migrar**  
    Identifica la ubicación del disco virtual que deseas convertir. Generalmente, estos tienen formato .vdi (VirtualBox) o .vmdk (VMware).

2. **Herramienta qemu-img**  
    Utiliza esta herramienta para convertir discos virtuales entre diferentes formatos.

3. **Virt-Manager**  
    Una interfaz gráfica que facilita la gestión de máquinas virtuales mediante libvirt.

4. **Un Poco de Tiempo**  
    Aunque el proceso es sencillo, puede tardar algunos minutos, dependiendo del tamaño del disco virtual.

Si aún no tienes configurado tu entorno de virtualización, consulta mi guía sobre [Máquinas Virtuales con KVM](https://blog.voros.xyz/posts/vm-kvm-libvirt-qemu).

---

## **Pasos para Migrar tu Máquina Virtual**

### **Paso 1: Ubica el Disco Virtual**
Identifica el archivo de disco virtual asociado a tu máquina virtual:

- **VirtualBox**: Busca un archivo con extensión `.vdi`.
- **VMware**: Busca un archivo con extensión `.vmdk`.

Por ejemplo, en VMware los discos virtuales suelen estar ubicados en:

```bash
/home/myuser/vmware
```

---

### **Paso 2: Convierte el Disco Virtual al Formato QCOW2**
Utiliza la herramienta `qemu-img` para convertir el disco al formato QCOW2.

```bash
qemu-img convert -f [formato_origen] -O qcow2 /ruta/al/disco_origen /ruta/al/disco_destino.qcow2
```

- **[formato_origen]**: Usa `vdi` para discos de VirtualBox o `vmdk` para discos de VMware.
- **/ruta/del/disco_origen**: Especifica la ubicación del archivo de disco original.
- **/ruta/del/disco_destino.qcow2**: Define la ruta y nombre del nuevo archivo convertido.

**Ejemplo:** 
Si tienes un archivo llamado `My_VM.vdi` en tu directorio personal, el comando sería:

```bash
qemu-img convert -f vdi -O qcow2 ~/My_VM.vdi ~/My_VM.qcow2
```

---

### **Paso 3: Configura la Máquina Virtual en Virt-Manager**
Con el disco convertido a QCOW2, sigue estos pasos para configurar tu nueva máquina virtual.

1. Abre Virt-Manager y selecciona la opción **"Nueva máquina virtual"**.
2. Elige **"Importar imagen de disco existente"** como método de instalación.
3. Navega y selecciona el archivo `.qcow2` recién creado.
4. Configura el sistema operativo (Windows, Linux, etc.) y asigna los recursos necesarios como CPU, memoria RAM y almacenamiento.
5. Completa la configuración y enciende la máquina virtual para verificar que todo funcione correctamente.

---

## **Consideraciones para Máquinas Virtuales con Windows y Linux**

### **Migrando Máquinas Virtuales con Windows**

- **Instalación de Drivers VirtIO:**  
  Para garantizar un rendimiento óptimo en KVM/QEMU, es fundamental instalar los drivers VirtIO en tu máquina virtual con Windows. Descárgalos desde el sitio oficial de Fedora: [virtio-win-guest-tools.exe](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads).  

- **Configuración de Dispositivos VirtIO:**  
  Durante la creación de la máquina virtual, selecciona controladores de red y almacenamiento con interfaz "virtio". Si Windows no reconoce estos dispositivos, asegúrate de instalar los drivers VirtIO antes de iniciar la migración o desde una ISO de drivers en la máquina virtual.  

---

### **Migrando Máquinas Virtuales con Linux**

- **Soporte Nativo para VirtIO:**  
  La mayoría de las distribuciones modernas de Linux incluyen soporte integrado para VirtIO, lo que simplifica la migración y mejora el rendimiento en KVM/QEMU.  

- **Verificación de Módulos del Kernel:**  
  Asegúrate de que los módulos necesarios, como `virtio_blk` (almacenamiento) y `virtio_net` (red), estén habilitados en tu sistema. Antes de la migración puedes verificar su estado con el siguiente comando:  

```bash
lsmod | grep virtio
```

Debe tener una salida similar a esta:

```bash
virtio_balloon         24576  0
virtio_console         40960  0
virtio_gpu             77824  0
virtio_dma_buf         16384  1 virtio_gpu
drm_shmem_helper       20480  1 virtio_gpu
drm_kms_helper        212992  3 virtio_gpu
drm                   614400  4 drm_kms_helper,drm_shmem_helper,virtio_gpu
virtio_rng             16384  0
virtio_net             73728  0
net_failover           24576  1 virtio_net
virtio_blk             28672  3
virtio_pci             24576  0
virtio_pci_legacy_dev    16384  1 virtio_pci
virtio_pci_modern_dev    20480  1 virtio_pci
virtio                 20480  7 virtio_rng,virtio_console,virtio_balloon,virtio_gpu,virtio_pci,virtio_blk,virtio_net
virtio_ring            45056  7 virtio_rng,virtio_console,virtio_balloon,virtio_gpu,virtio_pci,virtio_blk,virtio_net
```
---

## **Preguntas Frecuentes (FAQ)**

**¿Qué debo hacer si mi máquina virtual muestra un kernel panic al iniciar?**  
El primer paso es identificar el error exacto que se está mostrando.  

**Ejemplo:**  
`Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(8,2)`

Este error ocurre cuando el kernel no puede encontrar el sistema de archivos raíz. En este caso, el problema es que el módulo `virtio_blk` no está habilitado.  

- **¿Qué significa `unknown-block(8,2)`?**  
  - **`8`**: Indica un dispositivo de tipo SCSI o similar, como un disco SATA.  
  - **`2`**: Representa la segunda partición del dispositivo, que podría ser `/dev/sda2`.  

Cuando configuras una máquina en Virt-Manager, por defecto se utiliza el tipo de bus VirtIO. Si el kernel no tiene soporte para `virtio_blk`, no podrá detectar el dispositivo como `/dev/vda2`, resultando en el error.  

1. Cambia temporalmente el controlador del disco en Virt-Manager a **SATA** para que el sistema pueda arrancar.  
2. Inicia la máquina y dentro del sistema, instala los módulos de **VirtIO**.  
3. En Virt-Manager, cambia nuevamente el controlador del disco a **VirtIO**. Esto puede hacerse modificando el XML o eliminando y volviendo a agregar el disco configurándolo como VirtIO.  
4. Inicia la máquina con el nuevo controlador VirtIO.

Este proceso también aplica para máquinas virtuales con Windows, revisa la sección [Migrando Máquinas Virtuales con Windows](#Migrando-Máquinas-Virtuales-con-Windows). 

**Nota:** Si por algún motivo no puedes utilizar VirtIO, selecciona el controlador de bus más adecuado para tu sistema operativo y necesidades. SATA es una opción común y ampliamente soportada.  

---

**¿Qué sucede con mis configuraciones actuales de red y hardware?**  
Cuando migras a Virt-Manager, los dispositivos de hardware virtualizados, como controladores de red o gráficos, pueden cambiar. Ajusta las configuraciones en caso de ser necesario. Esto incluye seleccionar tipos de adaptadores de red compatibles o ajustar los recursos asignados (CPU, RAM). Los controladores VirtIO son los mas recomendables.

---

**¿Puedo revertir el proceso si algo sale mal?**  
Si, pero asegúrate de crear copias de seguridad de tus discos virtuales antes de comenzar el proceso de migración. Esto te permitirá volver al entorno original en caso de que algo no funcione como esperas.  

---
