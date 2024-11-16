---
title: Maquinas virtuales casi nativas con kvm usando debian/ubuntu
description: Aprende cómo configurar y asegurar tu servidor OpenSSH siguiendo prácticas 
             recomendadas para reducir riesgos y proteger tus conexiones remotas.
author: Vor
date: 2024-11-16
categories: [Guides, Virtualization, KVM, Qemu, Libvirt]
tags: [Virtualiization, Linux]
image:
    path: /assets/img/posts/guides/linux/Linux-KVM-logo-transparent.png
    alt: KVM Logo
---

## Introducción


En este post, exploraremos cómo configurar nuestro sistema para poder crear y administrar 
maquinas virtuales de kvm, utilizando qemu y libvirt.

**Temas que abordaremos:**
- Instalacion y configuracion 
- Guia rapida a virt-manager
- Creacion de una maquina virtual

## ¿Qué es KVM?

Kernel Virtual Machine (KVM) es una tecnologia de virtualizacion que permite transformar 
a Linux en un hipervisor que nos permitira ejecutar varios entornos virtuales aislados 
llamados maquinas virtuales (VM)

## ¿Cómo funciona KVM?
KVM convierte a linux en un hipervisor de tipo 1 (bare metal). Todos los hipervisores 
necesitan elementos del sistema operativo (por ejemplo, el administrador de memoria, 
el programador de procesos, el stack de red, etc) para poder ejecutar las maquinas virtuales.
Las KVM tienen todos estos elementos porque forman parte del kernel de Linux. Cada maquina
virtual se implementa como un proceso habitual de Linux, el cual se programa con la herramienta
estandar de Linux para este fin, e incluye sistemas virtuales de hardware exclusivos, como 
la tarjeta de red, la CPU, memoria RAM, discos, etc

### Características clave de KVM:

## Instalación y configuracion del entorno

Para configurar el entorno de virtualizacion tenemos que instalar algunos paquetes en el
sistema:

### En sistemas basados en Debian/Ubuntu:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virtinst libvirt-daemon
```

Una vez instalado, asegúrate de que el servicio esté en ejecución:
```bash
sudo systemctl start ssh
sudo systemctl enable ssh
```

## Configuración de OpenSSH 

### 1. **Deshabilitar el acceso root**
Es una buena práctica deshabilitar el inicio de sesión de root para prevenir accesos no autorizados 
a un usuario privilegiado.

En el archivo `/etc/ssh/sshd_config`, busca la siguiente línea:
```bash
PermitRootLogin yes
```
Cámbiala a:
```bash
PermitRootLogin no
```
Luego, reinicia el servicio SSH para aplicar los cambios:
```bash
sudo systemctl restart ssh
```

### 2. **Usar claves SSH en lugar de contraseñas**

La autenticación basada en claves SSH es mucho más segura que las contraseñas. Para configurarlo:

1. Genera un par de claves en tu máquina local:

    **RSA (Más común):**
    ```bash
    ssh-keygen -t rsa -b 4096 -C "<comentario>"
    ```

    **Ed25519 (Recomendada, más moderna):**
    ```bash
    ssh-keygen -t ed25519 -C "<comentario>"
    ```

2. Copia la clave pública al servidor:
```bash
ssh-copy-id usuario@servidor
```
3. Asegúrate de que el servidor permite la autenticación por claves en el archivo `/etc/ssh/sshd_config`:
```bash
PasswordAuthentication no
PubkeyAuthentication yes
```

### 3. **Cambiar el puerto por defecto**
El puerto predeterminado para SSH es el 22, que es uno de los mas atacados por bots. 
Cambiar el puerto puede añadir una capa de protección.

En `/etc/ssh/sshd_config`, busca y cambia la línea:
```bash
Port 22
```
Por otro puerto, por ejemplo, 2222:
```bash
Port 2222
```
No olvides abrir el nuevo puerto en tu firewall y reiniciar el servicio SSH:
```bash
sudo systemctl restart ssh
```

### 4. **Configurar el límite de intentos de autenticación**

Para proteger el servidor de ataques de fuerza bruta, limita el número de intentos fallidos 
de autenticación.

En el archivo `/etc/ssh/sshd_config`, añade las siguientes líneas:
```bash
MaxAuthTries 3
MaxSessions 2
```

### 5. **Deshabilitar la autenticación por contraseñas**

Si utilizas claves SSH, puedes deshabilitar el acceso mediante contraseñas para aumentar 
aun más la seguridad.

En `/etc/ssh/sshd_config`:
```bash
PasswordAuthentication no
PermitEmptyPasswords no
```

## Monitoreo y Auditoría de SSH

Una buena práctica es monitorear los intentos de acceso y asegurarse de que no haya actividad 
sospechosa en el servidor.

- Revisa los logs de SSH regularmente usando `journalctl -fu ssh` en GNU/Linux con systemd. 
  Como alternativa, puedes usar `tail -f /var/log/auth.log` o `tail -f /var/log/secure`.
- Configura un sistema de detección de intrusos como **Fail2Ban** para bloquear automáticamente 
  las IPs que intentan acceder con ataques de fuerza bruta.
