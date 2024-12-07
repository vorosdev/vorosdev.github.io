---
title: Como convertir una VM de VMware/VirtualBox a QEMU/KVM 
description: Vamos a aprender como migrar tus maquinas virtuales de VMWare 
             o VirtualBox al formato QCOW2 de QEMU
author: Vor
date: 2024-12-08
categories: [Guides, Virtualization]
tags: [Virtualization, Linux, KVM, QEMU, Libvirt,Virt-Manager, VMWare, VirtualBox]
image:
    path: /assets/img/posts/guides/linux/Linux-KVM-logo-transparent.webp
    alt: KVM Logo
---


# Cómo Migrar Máquinas Virtuales de VirtualBox y VMware a QCOW2 para usarlas con Virt-Manager

En esta guia vamos a aprender como migrar maquinas virtuales que tengamos en VMware, VirtualBox,
Hyper-V, etc.

---

## **¿Qué Necesitas para Empezar?**

1. **La Máquina Virtual que Deseas Migrar**  
   Asegúrate de saber dónde está almacenado el disco virtual (formato .vdi para VirtualBox y .vmdk para VMware).

2. **qemu-img**  
   Una herramienta para convertir discos virtuales entre diferentes formatos. 

3. **Virt-Manager**  
   Una interfaz gráfica para gestionar máquinas virtuales con libvirt. 

4. **Un Poco de Tiempo**  
   El proceso no es complicado, pero puede tomar unos minutos dependiendo del tamaño del disco.

Si no tienes preparado el entorno para virtualizacion, puedes seguir la guia de [https://blog.voros.xyz/posts/vm-kvm-libvirt-qemu][Máquinas Virtuales con KVM].

---

## **Pasos para Migrar tu Máquina Virtual**

### **Paso 1: Localiza el Disco Virtual**
Primero, necesitas encontrar el archivo de disco virtual asociado con tu máquina.  

- En **VirtualBox**, busca un archivo con extensión `.vdi`.
- En **VMware**, busca un archivo con extensión `.vmdk`.

Por ejemplo, en VMware los archivos se encuentran en ```~/vmware```

---

### **Paso 2: Convierte el Disco Virtual al Formato QCOW2**
Con la herramienta `qemu-img`, puedes convertir el disco al formato QCOW2. 

```bash
qemu-img convert -f [formato_origen] -O qcow2 /ruta/al/disco_origen /ruta/al/disco_destino.qcow2
```

- **[formato_origen]:** Usa `vdi` si vienes de VirtualBox, o `vmdk` si vienes de VMware.
- **/ruta/del/disco_origen:** Es la ubicación del disco original.
- **/ruta/al/disco_destino.qcow2:** Es donde guardarás el nuevo disco convertido.

**Ejemplo:** Si tienes un archivo `my_vm.vdi` en tu home, el comando sería:
```bash
qemu-img convert -f vdi -O qcow2 ~/my_vm.vdi ~/my_vm.qcow2
```

---

### **Paso 3: Crea la Máquina Virtual en Virt-Manager**
Ahora que tienes tu disco en formato QCOW2, es hora de crear la máquina virtual en virt-manager.

1. Abre Virt-Manager y selecciona "Nueva máquina virtual".
2. Escoge la opción "Importar imagen de disco existente".
3. Selecciona el archivo `.qcow2` que acabas de crear.
4. Configura el sistema operativo (Windows, Linux, etc.) y ajusta los recursos como CPU y memoria RAM.
5. Finaliza la configuración y enciende la máquina virtual.

---

## **Consideraciones para Windows y Linux**

### **Migrando Máquinas Virtuales con Windows**
- **Instala Drivers VirtIO:**  
  Para garantizar un buen rendimiento en KVM/QEMU, instala los drivers VirtIO en tu máquina virtual con Windows. Puedes descargarlos desde el sitio oficial de Fedora: [virtio-win-guest-tools.exe](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads).

- **Cuidado con los Dispositivos VirtIO:**  
  Durante la configuración, elige controladores de red y almacenamiento como "virtio". Si Windows no reconoce estos dispositivos, instala los drivers mencionados desde antes de la migracion.

---

### **Migrando Máquinas Virtuales con Linux**
- **Soporte Integrado para VirtIO:**  
  La mayoría de las distribuciones Linux modernas tienen soporte nativo para VirtIO, lo que facilita la migración.

- **Verifica los Módulos de Kernel:**  
  Asegúrate de que los módulos necesarios (como `virtio_blk` y `virtio_net`) estén habilitados.

Verifica los modulos con: 
```bash
lsmod | grep virtio
```
Debe tener una salida similar a esta
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

## **FAQ**

**¿Qué pasa con mis configuraciones actuales de red y hardware?**  
Cuando migres a virt-manager, el hardware virtualizado puede cambiar. Ajusta las configuraciones según sea necesario para que coincidan con las originales.

**¿Puedo revertir el proceso si algo sale mal?**  
Claro!, pero asegúrate de tener copias de seguridad de tus discos virtuales antes de comenzar. Si algo falla, siempre puedes volver al entorno original.

---
