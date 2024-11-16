---
title: INSTALACIÓN MANUAL DE DEBIAN CON SYSV
description: Cómo hacer una instalación manual de Debian usando SysVinit con BTRFS + LUKS2 + GRUB2.
author: Vor
date: 2024-08-17
categories: [Guide, Linux]
tags: [linux, guide, installation, no-systemd]
image:
  path: /assets/img/posts/guides/linux/debian-nosystemd.webp
  alt: Debian logo
---

## Pre-instalación

###### Descargar la ISO
Voy a utilizar el live de Debian para iniciar, pero también se puede usar cualquier otra distro con modo live.
Puedes descargar la ISO desde el siguiente enlace:  
[Debian Live](https://www.debian.org/CD/live/)

##### Opcional: Instalar de forma remota
```bash
sudo passwd user # Asignamos una contraseña al usuario
sudo apt install ssh # Instalamos el servidor SSH
```

###### Instalación de paquetes
Nos hacemos root con `sudo su`:

```bash
apt install debootstrap cryptsetup arch-install-scripts dosfstools btrfs-progs gdisk
```

## Particionado del disco

Particionamos el disco en dos particiones: una para el gestor de arranque y otra para el sistema.

```bash
# Disco a utilizar
export DISK=/dev/sda # Cambia esto al disco que corresponda, puedes verificar con lsblk

# Limpiar la tabla de particiones
sgdisk --zap-all $DISK

# Partición 1 - EFI
sgdisk -n 1:2048:+512M -t 1:EF00 $DISK

# Partición 2 - Linux LUKS
sgdisk -n 2:0:0 -t 2:8309 $DISK
```

###### Creación del sistema de archivos
```bash
# Formatear la partición EFI
mkfs.fat -F 32 -n EFI ${DISK}1

# Crear el contenedor LUKS para BTRFS
cryptsetup -v luksFormat --type luks2 --pbkdf pbkdf2 --hash sha512 ${DISK}2

# Abrir el contenedor LUKS, introduce la contraseña que diste en el paso anterior
cryptsetup open ${DISK}2 cryptroot

# Crear el sistema de archivos BTRFS
mkfs.btrfs /dev/mapper/cryptroot
```

###### Crear los subvolúmenes de BTRFS y montarlos
```bash
# Montar el contenedor LUKS en /mnt
mount /dev/mapper/cryptroot /mnt

# Crear los subvolúmenes
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@swap 

# Desmontar el sistema de archivos BTRFS de /mnt
umount /mnt

# Montar el subvolumen de root
mount -o noatime,compress=zstd:1,subvol=@ /dev/mapper/cryptroot /mnt

# Creación de directorios para otros subvolúmenes
mkdir -p /mnt/{boot,home,.snapshots}

# Montar los otros subvolúmenes
mount -o noatime,compress=zstd:1,subvol=@home /dev/mapper/cryptroot /mnt/home
mount -o noatime,compress=zstd:1,subvol=@snapshots /dev/mapper/cryptroot /mnt/.snapshots

# Montar la partición EFI
mkdir /mnt/boot/efi
mount ${DISK}1 /mnt/boot/efi

## Opcional ##
# Creación y uso de swapfile
mkdir -p /mnt/swap
mount -o subvol=@swap /dev/mapper/cryptroot /mnt/swap
btrfs filesystem mkswapfile --size 16G /mnt/swap/swapfile # Puedes modificar la cantidad de GB que le asignas
swapon /mnt/swap/swapfile
```

## Instalación con debootstrap
Creamos el árbol de directorios usando `debootstrap`. En este caso, usaré la última versión estable, **Bookworm**:

```bash
debootstrap --arch amd64 bookworm /mnt 
```

###### Configuración del sistema

Crearemos un subvolumen solo para los logs, de modo que podamos excluirlos de las snapshots de root.

```bash
mv /mnt/var/log /mnt/var/log-old
btrfs subvolume create /mnt/var/log
cp -a /mnt/var/log-old/* /mnt/var/log/
rm -rf /mnt/var/log-old
```

Montamos los sistemas de archivos virtuales:

```bash
mount -o bind /dev /mnt/dev
mount -o bind /dev/pts /mnt/dev/pts
mount -o bind /proc /mnt/proc
mount -o bind /sys /mnt/sys
mount -o bind /sys/firmware/efi/efivars /mnt/sys/firmware/efi/efivars
```

Generamos el archivo `fstab` con la utilidad `genfstab` del paquete `arch-install-scripts`:

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

Creamos el archivo `crypttab`:

```bash
# Con `blkid` vamos a obtener el UUID de la partición encriptada (por ejemplo: sda2), no del contenedor LUKS (cryptroot)
blkid

export CRYPTROOT_UUID=uuid-de-la-particion-encriptada
echo -e "cryptroot\tUUID=$CRYPTROOT_UUID\tnone\tluks" > /mnt/etc/crypttab
```

Entramos en un entorno `chroot` y hacemos una configuración básica:

```bash
# Entrar al `chroot` solo si se montaron de forma correcta los sistemas de archivos virtuales 
chroot /mnt /bin/bash

apt install locales console-setup vim

dpkg-reconfigure tzdata
dpkg-reconfigure locales
dpkg-reconfigure console-setup

export HOSTNAME=tunombredehost
echo $HOSTNAME > /etc/hostname
echo "127.0.1.1 $HOSTNAME.localdomain $HOSTNAME" >> /etc/hosts
```

Configuramos los mirrors para el gestor de paquetes `apt`. Puedes tomar como ejemplo la `sources.list` de Debian:  
[Debian SourcesList](https://wiki.debian.org/SourcesList)

```bash
vim /etc/apt/sources.list # Abre el archivo para ingresar los mirrors

deb http://deb.debian.org/debian bookworm main non-free-firmware
deb-src http://deb.debian.org/debian bookworm main non-free-firmware

deb http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware
deb-src http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware

deb http://deb.debian.org/debian bookworm-updates main non-free-firmware
deb-src http://deb.debian.org/debian bookworm-updates main non-free-firmware
```

Actualizamos la lista de repositorios e instalamos el kernel junto a otras utilidades:

```bash 
apt update
apt install linux-image-amd64 linux-headers-amd64 network-manager firmware-linux firmware-iwlwifi firmware-linux-nonfree bash-completion command-not-found btrfs-progs sudo neovim usbutils hwinfo connman wget curl htop
```

Asignamos una contraseña a root:

```bash 
passwd
```

Añadimos un usuario normal y le asignamos sus grupos:

```bash 
useradd -m -c "tu nombre" -s /bin/bash user
passwd user 
usermod -aG sudo,adm,dialout,cdrom,floppy,audio,dip,video,plugdev,users,netdev,bluetooth user
```

## Instalacion de SysVinit

```bash
# Remplazamos a systemd con sysvinit
apt install -y sysvinit-core sysvinit-utils libpam-elogind
```

##### Añadir repositorios no-systemd

###### Loc-OS
```bash
# Descargar 
wget -O /tmp/loc-os-23-archive-keyring_23.12.11_all.deb http://br.loc-os.com/pool/main/l/loc-os-23-archive-keyring/loc-os-23-archive-keyring_23.12.11_all.deb

# Instalacion
apt install -y /tmp/loc-os-23-archive-keyring_23*.deb 
rm /tmp/loc-os-23-archive-keyring*.deb 


# Editamos la mirrorlist `rim /etc/apt/sources.list.d/loc-os.list`
# Aqui podemos descomentar la que se encuentre mas cerca a nosotros o la que funcione mejor
# Ejemplo:

# BRAZIL
deb http://br.loc-os.com contutti main
# FRANCE
#deb http://fr.loc-os.com contutti main
# USA
#deb http://us.loc-os.com contutti main
```

##### Instalacion de paquetes 
```bash
# Actualizamos los repositorios
apt update  
apt install -y libeudev1 
apt-get purge --auto-remove *systemd*

# Bloqueamos a systemd 
echo -e "Package: *systemd*\nPin: origin \"*\"\nPin-Priority: -1" > /etc/apt/preferences.d/nosystemd

# De nuevo abrimos el archivo de las mirrorlist `vim /etc/apt/sources.list.d/loc-os.list`
# y comentamos todos las opciones, por el momento ya no son necesarias
# Ejemplo:

# BRAZIL
#deb http://br.loc-os.com contutti main
# FRANCE
#deb http://fr.loc-os.com contutti main
# USA
#deb http://us.loc-os.com contutti main 
```

##### Instalacion de microcodigo 
```bash
apt install amd64-microcode # para procesadores de AMD
apt install intel-microcode # para procesadores de Intel
```

## Instalacion del bootloader

##### Instalación y configuración de grub2

```bash
# Instalamos los paquetes necesarios
apt install -y efibootmgr grub-efi-amd64 cryptsetup-initramfs 
```

##### Configurar `grub` para UEFI:

##### Editamos el archivo `/etc/default/grub`
```bash
# Nos deberia de quedar como este ejemplo, el UUID es de la particion encriptada
# (example: sda2), puedes revisarlo con la herramienta `blkid`

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX="cryptdevice=UUID=UUID-Particion-Encriptada:cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw rootfstype=btrfs"
GRUB_ENABLE_CRYPTODISK=y
```

##### Instalamos el grub
```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --boot-directory=/boot
update-grub
```

## Instalación de un escritorio (opcional)

```bash
apt install xfce4 -y
```

## Final

Ahora podemos reiniciar, solo es necesario desmontar los sistemas de archivos:

```bash
# Salimos del chroot
exit

# Desmontamos los sistemas de archivos
umount /mnt/boot/efi
umount /mnt/{dev/pts,dev,proc,sys}
umount /mnt
```

Reiniciamos el equipo:

```bash
reboot
```
