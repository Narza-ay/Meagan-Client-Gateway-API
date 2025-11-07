import 'dotenv/config'
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;
const SERVICE_START_PORT = 3001;
const SERVICES_DIR = path.join(__dirname, 'services');
const HEALTH_CHECK_INTERVAL = 30 * 1000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const services = {};

/**
 * Définit les commandes disponibles et leurs handlers.
 * Chaque commande a une 'description' et une fonction 'execute'.
 * La fonction 'execute' prend 'args' (arguments de la commande) et 'menuCallback' (pour rafraîchir le menu).
 */
const commands = {
    'start all': {
        usage: 'start all',
        description: 'Lance tous les services découverts.',
        execute: (args, menuCallback) => {
            let startedCount = 0;
            for (const serviceName in services) {
                if (!services[serviceName].process || services[serviceName].process.exitCode !== null) {
                    startService(serviceName);
                    startedCount++;
                }
            }
            if (startedCount > 0) {
                menuCallback(chalk.green(`Tentative de lancement de ${startedCount} service(s). Vérifiez le statut.`));
            } else {
                menuCallback(chalk.yellow('Tous les services semblent déjà en cours d\'exécution.'));
            }
        }
    },
    'start': {
        usage: 'start <serviceName>',
        description: 'Lance un service spécifique.',
        execute: (args, menuCallback) => {
            if (args.length !== 1) {
                menuCallback(chalk.red('Erreur: La commande "start" nécessite le nom d\'un service. Utilisation: "start <serviceName>"'));
                return;
            }
            startService(args[0]);
        }
    },
    'stop': {
        usage: 'stop <serviceName>',
        description: 'Arrête un service spécifique.',
        execute: (args, menuCallback) => {
            if (args.length !== 1) {
                menuCallback(chalk.red('Erreur: La commande "stop" nécessite le nom d\'un service. Utilisation: "stop <serviceName>"'));
                return;
            }
            stopService(args[0]);
        }
    },
    'list services': {
        usage: 'list services',
        description: 'Affiche la liste et le statut de tous les services découverts.',
        execute: (args, menuCallback) => {
            menuCallback();
            console.log(`
${chalk.strikethrough.dim('                                  ')} ${chalk.cyan('Services Découverts')} ${chalk.strikethrough.dim('                                  ')}
`);
            if (Object.keys(services).length === 0) {
                console.log(chalk.yellow('Aucun service .js trouvé dans le dossier ' + SERVICES_DIR));
            } else {
                for (const serviceName in services) {
                    const svc = services[serviceName];
                    let statusColor;
                    switch (svc.status) {
                        case 'online':
                        case 'online (WS)':
                            statusColor = chalk.green;
                            break;
                        case 'starting':
                            statusColor = chalk.yellow;
                            break;
                        case 'offline':
                            statusColor = chalk.grey;
                            break;
                        case 'error':
                            statusColor = chalk.red;
                            break;
                        default:
                            statusColor = chalk.white;
                    }
                    console.log(`  ${chalk.magenta(serviceName.padEnd(15))} : ${statusColor(svc.status.padEnd(10))} ${chalk.dim(`(${svc.url}${svc.proxyPath})`)}`);
                }
            }
            console.log(`
${chalk.strikethrough.dim('                                                                                                    ')}
`);
        }
    },
    'find': {
        usage: 'find <email>',
        description: 'Recherche des utilisateurs par email ou ID.',
        execute: (args, menuCallback) => {
            if (args.length < 1) {
                menuCallback(chalk.red('Erreur: La commande "find" nécessite une requête. Utilisation: "find <query>"'));
                return;
            }
            const query = args.join(' ');
            // Ici, on utilisera Mongoose pour rechercher dans la base de données.
            // Pour l'instant, on simule la recherche.
            menuCallback(`Recherche en cours pour: "${chalk.cyan(query)}"... (Logique de recherche à implémenter)`);
        }
    },
    'set role': {
        usage: 'set role <role> <userId>',
        description: 'Ajoute un rôle à un utilisateur.',
        execute: (args, menuCallback) => {
            if (args.length < 2) {
                menuCallback(chalk.red('Erreur: La commande "set role" nécessite un rôle et un ID utilisateur. Utilisation: "set role <role> <userId>"'));
                return;
            }
            const [role, userId] = args;
            // Pareil, on utilisera Mongoose pour ajouter le rôle à l'utilisateur.
            // Pour l'instant, on simule l'ajout.
            menuCallback(`Tentative d'ajouter le rôle "${chalk.magenta(role)}" à l'utilisateur "${chalk.green(userId)}"... (Logique à implémenter)`);
        }
    },
    'remove role': {
        usage: 'remove role <role> <userId>',
        description: 'Retire un rôle à un utilisateur.',
        execute: (args, menuCallback) => {
            if (args.length < 2) {
                menuCallback(chalk.red('Erreur: La commande "remove role" nécessite un rôle et un ID utilisateur. Utilisation: "remove role <role> <userId>"'));
                return;
            }
            const [role, userId] = args;
            // Ici aussi, on utilisera Mongoose pour retirer le rôle de l'utilisateur.
            // Pour l'instant, on simule le retrait.
            menuCallback(`Tentative de retirer le rôle "${chalk.magenta(role)}" à l'utilisateur "${chalk.green(userId)}"... (Logique à implémenter)`);
        }
    },
    'list roles': {
        usage: 'list roles <.||userId>',
        description: 'Affiche les rôles d\'un utilisateur ou tous les rôles disponibles.',
        execute: (args, menuCallback) => {
            if (args.length === 1) {
                const userId = args[0];
                // Logique pour lister les rôles d'un utilisateur spécifique
                // Pour l'instant, on simule la liste des rôles.
                menuCallback(`Affichage des rôles pour l'utilisateur "${chalk.green(userId)}"... (Logique à implémenter)`);
            } else if (args.length === 0) {
                // Logique pour lister tous les rôles disponibles
                // Pour l'instant, on simule la liste des rôles.
                menuCallback('Liste de tous les rôles disponibles: Admin, User, Editor, Viewer... (Logique à implémenter)');
            } else {
                menuCallback(chalk.red('Erreur: Utilisation incorrecte de "list roles". Voir "help".'));
            }
        }
    },
    'time': {
        usage: 'time',
        description: 'Affiche l\'heure actuelle du serveur.',
        execute: (args, menuCallback) => {
            menuCallback(`Il est ${chalk.cyan(new Date().toLocaleTimeString('fr-FR'))}.`);
        }
    },
    'ping': {
        usage: 'ping',
        description: 'Renvoie le temps de réponse du serveur.',
        execute: (args, menuCallback) => {
            const startTime = Date.now();
            const endTime = Date.now();
            menuCallback(`Pong! Temps de réponse: ${chalk.green(endTime - startTime)}ms`);
        }
    },
    'help': {
        usage: 'help',
        description: 'Affiche cette aide.',
        execute: (args, menuCallback) => {
            menuCallback(); // Réaffiche le menu principal sans message
            console.log(`
        ${chalk.strikethrough.dim('                              ')} ${chalk.cyan('Commandes disponibles')} ${chalk.strikethrough.dim('                              ')}
`);
            // Génère dynamiquement la liste des commandes
            for (const cmd in commands) {
                console.log(`          "${chalk.yellow(commands[cmd].usage)}"${' '.repeat(Math.max(0, 30 - commands[cmd].usage.length))} : ${commands[cmd].description}`);
            }
            console.log(`          ""${' '.repeat(Math.max(0, 30 - ''.length))} : Affiche le menu principal.`);
            console.log(`
        ${chalk.strikethrough.dim('                                                                                    ')}
`);
        }
    },
    'exit': {
        usage: 'exit',
        description: 'Ferme le serveur.',
        execute: (args, menuCallback) => {
            menuCallback("Fermeture du serveur...");
            rl.close();
            process.exit(0);
        }
    }
};

/**
 * Affiche le menu principal du serveur.
 * @param {string} arg - Un message optionnel à afficher sous le menu.
 */
function menu(arg = '') {
    console.clear();
    console.log(`
        ${chalk.hex('#7269b8').bold('MEAGAN API')} ${chalk.hex('#524C84').bold('- GATEWAY')} ${chalk.blackBright('v.1.0.0')}

        ${chalk.hex('#7269b8')('➜')}    ${chalk.white('Addresse:')} ${chalk.cyan(`http://localhost:${PORT}`)}
        ${chalk.hex('#524C84')('➜')}    ${chalk.blackBright('Tapez "help" pour afficher les commandes disponibles.')}
        ${chalk.hex('#524C84')('➜')}    ${chalk.blackBright('Pour quitter, tapez "exit".')}
`);

    console.log(chalk.hex('#7269b8')('        Statut des services:\n'));
    if (Object.keys(services).length === 0) {
        console.log(chalk.yellow(`        ${chalk.hex('#7269b8')('➜')}    Aucun service découvert pour le moment.`));
    } else {
        for (const serviceName in services) {
            const svc = services[serviceName];
            let statusColor;
            switch (svc.status) {
                case 'online':
                case 'online (WS)':
                    statusColor = chalk.green;
                    break;
                case 'starting':
                    statusColor = chalk.yellow;
                    break;
                case 'offline':
                    statusColor = chalk.grey;
                    break;
                case 'error':
                    statusColor = chalk.red;
                    break;
                default:
                    statusColor = chalk.white;
            }
            console.log(`        ${chalk.hex('#7269b8')('➜')}    ${serviceName.padEnd(10)}: ${statusColor(svc.status)}`);
        }
    }

    console.log(`        ${arg ? `\n\n        ${chalk.hex('#7269b8')('➜')}    ` + chalk.yellow(arg) : ''}`);

    rl.question(`${chalk.blackBright.dim('>')} `, (command) => {
        processCommand(command.trim());
    });
}

/**
 * Traite la commande entrée par l'utilisateur.
 * @param {string} commandInput - La chaîne de caractères entrée par l'utilisateur.
 */
function processCommand(commandInput) {
    if (commandInput === '') {
        menu();
        return;
    }

    let commandFound = false;
    for (const cmdKey in commands) {
        const regex = new RegExp(`^${escapeRegExp(cmdKey)}(?:\\s+(.*))?$`, 'i');
        const match = commandInput.match(regex);

        if (match) {
            const argsString = match[1] || '';
            const args = argsString.split(' ').filter(arg => arg !== '');

            commands[cmdKey].execute(args, menu);
            commandFound = true;
            break;
        }
    }

    if (!commandFound) {
        menu('Commande inconnue. Tapez "help" pour voir les commandes disponibles.');
    }
}

/**
 * Fonction utilitaire pour échapper les caractères spéciaux dans une chaîne pour une utilisation dans RegExp.
 * @param {string} string - La chaîne à échapper.
 * @returns {string} La chaîne échappée.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& signifie la correspondance entière
}

/**
 * Initialise les configurations de proxy et les informations des services
 * en scannant le dossier 'services'.
 */
async function initializeServices() {
    menu(`Scan du dossier des services: ${SERVICES_DIR}`);
    let currentPort = SERVICE_START_PORT;

    try {
        const files = await fs.promises.readdir(SERVICES_DIR);
        for (const file of files) {
            const filePath = path.join(SERVICES_DIR, file);
            const stats = await fs.promises.stat(filePath);

            if (stats.isFile() && path.extname(file).toLowerCase() === '.js') {
                const serviceName = path.basename(file, '.js'); // ex: 'auth', 'economy'
                const servicePort = currentPort++;
                const serviceUrl = `http://localhost:${servicePort}`;
                const serviceProxyPath = `/${serviceName}`;

                services[serviceName] = {
                    port: servicePort,
                    url: serviceUrl,
                    proxyPath: serviceProxyPath,
                    process: null,
                    status: 'offline', // online, offline, error, starting
                    proxyMiddleware: null,
                    healthCheckIntervalId: null,
                    type: 'http' // Ou 'ws' si c'est un WebSocket (ex: Game Service)
                };

                // Si le service est le service de jeu, on assume que c'est un WebSocket pour l'exemple
                if (serviceName === 'game') {
                    services[serviceName].type = 'ws';
                    services[serviceName].url = `ws://localhost:${servicePort}`;
                }

                menu(chalk.blue(`  - Service découvert: ${serviceName} sur le port ${servicePort}`));
                setupServiceProxy(serviceName);
            }
        }
    } catch (err) {
        menu(chalk.red(`Erreur lors de l'initialisation des services: ${err.message}`));
        process.exit(1);
    }
}

/**
 * Configure le proxy pour un service donné.
 * @param {string} serviceName - Le nom du service.
 */
function setupServiceProxy(serviceName) {
    const serviceConfig = services[serviceName];
    if (!serviceConfig) {
        console.error(chalk.red(`Erreur: Service ${serviceName} non trouvé pour la configuration du proxy.`));
        return;
    }

    const proxyOptions = {
        target: serviceConfig.url,
        changeOrigin: true,
        pathRewrite: {
            [`^${serviceConfig.proxyPath}`]: '/',
        },
        onProxyReq: (proxyReq, req, res) => {
            console.error(`Proxying ${serviceName} request to: ${proxyReq.path}`);
        },
        onError: (err, req, res, target) => {
            console.error(chalk.red(`Proxy error for ${serviceName} at ${target}:`), err.message);
            if (services[serviceName].status !== 'error') {
                services[serviceName].status = 'error';
                updateMenuLater();
            }
            if (!res.headersSent) {
                res.status(500).json({ code: `GATEWAY_500_${serviceName.toUpperCase()}`, message: `${serviceName} service is unavailable or timed out.` });
            }
        },
        timeout: 60000,
        proxyTimeout: 60000,
        openTimeout: 5000,
        closeTimeout: 5000,
    };

    if (serviceConfig.type === 'ws') {
        proxyOptions.ws = true;
        // Pour les WebSockets, onError reçoit (err, req, socket)
        proxyOptions.onError = (err, req, socket) => {
            console.error(chalk.red(`WebSocket proxy error for ${serviceName} at ${serviceConfig.url}:`), err.message);
            if (services[serviceName].status !== 'error') {
                services[serviceName].status = 'error';
                updateMenuLater();
            }
            // Tente de fermer la socket si possible
            if (socket && typeof socket.end === 'function') {
                socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\nService unavailable.');
            }
        };
    }

    const proxyMiddleware = createProxyMiddleware(proxyOptions);
    app.use(serviceConfig.proxyPath, proxyMiddleware);
    serviceConfig.proxyMiddleware = proxyMiddleware;
}

/**
 * Lance un service dans un nouveau child process.
 * @param {string} serviceName - Le nom du service à lancer.
 */
function startService(serviceName) {
    const service = services[serviceName];
    if (!service) {
        menu(chalk.red(`Service "${serviceName}" non trouvé.`));
        return;
    }

    if (service.process && service.process.exitCode === null) {
        menu(chalk.yellow(`Le service "${serviceName}" est déjà en cours d'exécution.`));
        return;
    }

    service.status = 'starting';
    // Pour Linux, il faudra le lancer dans un nouveau 'screen'
    // Pour Windows, une simple exécution de node suffit ou 'start cmd /k node'
    let command;
    let args;
    let spawnOptions = { cwd: SERVICES_DIR, detached: true, stdio: 'ignore' }; // stdio: 'ignore' pour ne pas connecter la console de la gateway

    if (process.platform === 'linux') {
        // Lance avec 'screen' pour avoir un terminal séparé.
        // NÉCESSITE QUE 'screen' SOIT INSTALLÉ ET QUE LE SERVICE S'ARRÊTE PROPREMENT.
        command = 'screen';
        args = ['-dmS', serviceName, 'node', path.basename(serviceName + '.js')];
        // Note: screen -dmS <session_name> <command>
        // C'est "détaché", vous devrez vous y attacher manuellement avec `screen -r <session_name>`
        spawnOptions.stdio = 'inherit'; // Pour voir la sortie dans le terminal screen
    } else if (process.platform === 'win32') {
        // Sur Windows, on utilise 'cmd /c start' pour ouvrir une nouvelle fenêtre CMD
        // C'est un peu "hacky" mais ça simule l'ouverture d'un nouveau terminal visuel.
        command = 'cmd.exe';
        args = ['/c', 'start', 'cmd.exe', '/k', `node ${path.basename(serviceName + '.js')} ${service.port}`];
        // Le '/k' garde la fenêtre ouverte après l'exécution.
        // On passe le port en argument au service si nécessaire (service.js prendra process.argv[2])
        spawnOptions = { cwd: SERVICES_DIR, detached: false, stdio: 'inherit' }; // Pour voir le log dans la nouvelle fenêtre
    }

    // Si on n'ouvre pas de nouveau terminal visuel, mieux vaut avoir 'ignore'
    if (process.platform !== 'linux' && process.platform !== 'win32') {
        spawnOptions.stdio = 'ignore'; // Pour ne pas afficher les logs des services dans le terminal de la gateway
    }


    try {
        service.process = spawn(command, args, spawnOptions);

        if (spawnOptions.detached) {
            service.process.unref(); // Permet au processus parent de quitter indépendamment des child processes
        }

        service.process.on('error', (err) => {
            console.error(chalk.red(`Erreur au lancement du service "${serviceName}": ${err.message}`));
            service.status = 'error';
            menu(`Le service "${serviceName}" n'a pas pu démarrer. Erreur: ${err.message}`);
            stopHealthCheck(serviceName);
        });

        service.process.on('exit', (code, signal) => {
            console.log(chalk.yellow(`Le service "${serviceName}" s'est arrêté avec le code ${code || signal}.`));
            service.status = 'offline';
            service.process = null;
            stopHealthCheck(serviceName);
            updateMenuLater();
        });

        console.log(chalk.green(`Lancement du service "${serviceName}"...`));
        // Commence la surveillance après un court délai pour laisser le temps au service de démarrer
        setTimeout(() => startHealthCheck(serviceName), 2000);
        updateMenuLater();

    } catch (e) {
        console.error(chalk.red(`Échec du lancement du service ${serviceName}: ${e.message}`));
        service.status = 'error';
        menu(`Échec du lancement du service ${serviceName}.`);
        stopHealthCheck(serviceName);
        updateMenuLater();
    }
}


/**
 * Arrête le processus d'un service.
 * @param {string} serviceName - Le nom du service à arrêter.
 */
function stopService(serviceName) {
    const service = services[serviceName];
    if (service && service.process && service.process.exitCode === null) {
        console.log(chalk.yellow(`Arrêt du service "${serviceName}"...`));
        service.process.kill('SIGTERM');
        service.status = 'offline';
        stopHealthCheck(serviceName);
        updateMenuLater();
    } else {
        menu(chalk.yellow(`Le service "${serviceName}" n'est pas en cours d'exécution.`));
    }
}

/**
 * Lance des health checks périodiques pour un service.
 * @param {string} serviceName - Le nom du service à surveiller.
 */
function startHealthCheck(serviceName) {
    const service = services[serviceName];
    if (!service) return;

    stopHealthCheck(serviceName);

    const checkStatus = async () => {
        try {
            if (service.type === 'ws') {
                // Ici, ou simule un WebSocket pour le service de jeu
                service.status = 'online (WS)';
                updateMenuLater();
                return;
            }

            const response = await fetch(`${service.url}/health`, { timeout: 3000 });
            if (response.ok) {
                if (service.status !== 'online') {
                    service.status = 'online';
                    updateMenuLater();
                }
            } else {
                console.warn(chalk.yellow(`Health check pour "${serviceName}" a échoué (HTTP ${response.status}).`));
                if (service.status !== 'offline') {
                    service.status = 'offline';
                    updateMenuLater();
                }
            }
        } catch (error) {
            console.error(chalk.red(`Health check error for "${serviceName}": ${error.message}`));
            if (service.status !== 'error') {
                service.status = 'error';
                updateMenuLater();
            }
        }
    };

    checkStatus();
    service.healthCheckIntervalId = setInterval(checkStatus, HEALTH_CHECK_INTERVAL);
}

/**
 * Arrête les health checks pour un service donné.
 * @param {string} serviceName - Le nom du service.
 */
function stopHealthCheck(serviceName) {
    const service = services[serviceName];
    if (service && service.healthCheckIntervalId) {
        clearInterval(service.healthCheckIntervalId);
        service.healthCheckIntervalId = null;
    }
}

let updateMenuTimeout = null;
function updateMenuLater() {
    if (updateMenuTimeout) {
        clearTimeout(updateMenuTimeout);
    }
    updateMenuTimeout = setTimeout(() => {
        menu();
        updateMenuTimeout = null;
    }, 100);
}

const server = http.createServer(app);

// http://localhost:3000/ doit retourner 'API Gateway is running!'
app.get('/', (req, res) => {
    res.send('API Gateway is running!');
});

app.listen(PORT, async () => {
    await initializeServices();
    menu();
});
