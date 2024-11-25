---
title: Mejora la seguridad de tu servidor OpenSSH
description: Aprende cómo configurar y asegurar tu servidor OpenSSH siguiendo prácticas 
             recomendadas para reducir riesgos y proteger tus conexiones remotas.
author: Vor
date: 2024-10-09
categories: [Guides, Security]
tags: [OpenSSH, Linux Security, SSH Configuration, SSH Authentication, Cybersecurity]
image:
    path: /assets/img/posts/guides/ssh/openssh_logo.webp
    alt: OpenSSH Logo
---

## Introducción
En este post, exploraremos cómo configurar el servidor OpenSSH para fortalecer la seguridad 
de tu sistema. SSH es una herramienta poderosa para acceder remotamente a servidores, pero 
configurarlo de manera segura es crucial para evitar vulnerabilidades y ataques. En esta guía, 
aprenderás a optimizar y asegurar tu configuración SSH.

**Temas que abordaremos:**
- Introducción al protocolo SSH.
- Configuración básica de OpenSSH.
- Buenas prácticas para asegurar tu servidor SSH.

## ¿Qué es el protocolo SSH?

El protocolo SSH (Secure Shell) nos permite realizar conexiones remotas a servidores de manera 
segura mediante la encriptación de los datos. A diferencia de otros protocolos como Telnet, SSH 
garantiza la confidencialidad e integridad de la información intercambiada entre el cliente 
(tú computadora) y el servidor.

### Características clave de SSH:
- **Encriptación:** Toda la comunicación se cifra, asegurando que los datos no sean interceptados.
- **Autenticación:** SSH admite diferentes métodos de autenticación, como contraseñas y claves públicas.
- **Túneles seguros:** SSH permite crear túneles seguros para redirigir tráfico a través de la conexión.

## Instalación de OpenSSH 

Para asegurarte de que OpenSSH está instalado en tu sistema, sigue estos pasos segun 
tu sistema:

### En sistemas basados en Debian/Ubuntu:
```bash
sudo apt update
sudo apt install openssh-server
```

### En sistemas basados en RHEL/CentOS:
```bash
sudo yum install openssh-server
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
