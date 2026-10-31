const chatLauncher = document.getElementById('chatLauncher');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const chatBody = document.getElementById('chatBody');
  const chatOptions = document.getElementById('chatOptions');

  const chatData = {
    root: {
      bot: "¡Hola! Soy el asistente de NiceCream 🍦 ¿En qué te ayudo?",
      options: [
        { label: "📍 Horarios y ubicaciones", next: "ubicaciones" },
        { label: "🍧 Ver el menú", next: "menu" },
        { label: "🥗 ¿Tienen opciones sin azúcar o veganas?", next: "dietas" },
        { label: "🎉 Pedidos para eventos", next: "eventos" },
        { label: "💳 ¿Aceptan tarjeta?", next: "pago" },
        { label: "🗳️ Vota por el próximo sabor", next: "votar" },
        { label: "⭐ Quiero dejar una reseña", next: "resena" },
        { label: "🆕 ¿Qué hay de nuevo?", next: "novedades" },
        { label: "✉️ Hablar con alguien", next: "contacto" }
      ]
    },
    ubicaciones: {
      bot: "Tenemos dos sucursales:\n\n• El Retoño (Iztapalapa): jueves a martes, 12:00 pm – 8:30 pm (cerrado los miércoles)\n• Pedregal (Tlalpan, dentro del Mercadito de la Unidad Pemex): miércoles 12–5 pm y sábado 12–4:30 pm",
      options: [
        { label: "Ver mapa de las sucursales", action: "scroll", target: "#sucursales" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    menu: {
      bot: "Tenemos paletas de agua, de crema, premium, con infusión, sin azúcar/keto, helados, malteadas, dorilocos, bebidas y más. Te llevo al menú completo.",
      options: [
        { label: "Ir al menú", action: "scroll", target: "#sabores" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    dietas: {
      bot: "¡Sí! Tenemos línea sin azúcar añadida (incluye keto) y varias opciones veganas marcadas en el menú. También hay una opción especial para mascotas 🐾",
      options: [
        { label: "Ver sección Keto / Sin azúcar", action: "scroll", target: "#sabores" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    eventos: {
      bot: "Manejamos paquetes para fiestas y eventos especiales. Puedes ver las opciones aquí mismo o escribirnos directo por WhatsApp con la fecha, número de personas y sucursal.",
      options: [
        { label: "Ver paquetes", action: "scroll", target: "#paquetes" },
        { label: "Escribir por WhatsApp", action: "link", target: "https://wa.me/525661448010?text=Hola%2C%20quiero%20cotizar%20un%20evento" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    pago: {
      bot: "Sí, aceptamos pago con tarjeta y también tarjetas de vales, en ambas sucursales.",
      options: [
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    votar: {
      bot: "¡Nos encanta que opines! Elige tu sabor favorito entre los candidatos de este mes y ayúdanos a decidir cuál sale.",
      options: [
        { label: "Ir a votar", action: "scroll", target: "#votacion" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    resena: {
      bot: "¡Gracias de antemano! Nos ayuda muchísimo. ¿En qué sucursal nos visitaste?",
      options: [
        { label: "El Retoño", action: "link", target: "https://g.page/r/Cc4HJ5olNIpbEBM/review" },
        { label: "Pedregal", action: "link", target: "https://g.page/r/CdyZqwwRU9PkEBM/review" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    novedades: {
      bot: "Entre nuestras novedades está la nieve de limón sin azúcar 🍋 Cítrica, ligera y refrescante. Pregunta por disponibilidad en tu sucursal.",
      options: [
        { label: "Ver todas las novedades", action: "scroll", target: "#novedades" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    },
    contacto: {
      bot: "Con gusto. La forma más rápida es por WhatsApp — ahí mismo te podemos ayudar con tu pedido o duda.",
      options: [
        { label: "Escribir por WhatsApp", action: "link", target: "https://wa.me/525661448010?text=Hola%2C%20tengo%20una%20pregunta" },
        { label: "⬅️ Regresar al inicio", next: "root" }
      ]
    }
  };

  function renderChatStep(stepKey){
    const step = chatData[stepKey];
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.textContent = step.bot;
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    chatOptions.innerHTML = '';
    step.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'chat-option-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-msg user';
        userMsg.textContent = opt.label;
        chatBody.appendChild(userMsg);
        chatBody.scrollTop = chatBody.scrollHeight;

        if(opt.action === 'scroll'){
          chatWindow.classList.remove('open');
          document.querySelector(opt.target).scrollIntoView({ behavior:'smooth' });
        } else if(opt.action === 'link'){
          window.open(opt.target, '_blank', 'noopener');
        } else {
          renderChatStep(opt.next);
        }
      });
      chatOptions.appendChild(btn);
    });
  }

  chatLauncher.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if(chatWindow.classList.contains('open') && chatBody.children.length === 0){
      renderChatStep('root');
    }
  });
  chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));
