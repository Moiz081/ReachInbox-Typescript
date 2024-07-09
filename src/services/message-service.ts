export function mailUser(sender: string,recipient: string,subject: string,content: string){
    const emailContent = [
        `From: ${sender}`,
        `To: ${recipient}`,
        'Content-type: text/html;charset=iso-8859-1',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        content,
      ].join('\r\n');
    
      const base64EncodedEmail = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
      return base64EncodedEmail;
}


export function replyInThread(sender: string,subject: string,content: string,threadId: string){
    const emailContent = [
        `From: ${sender}`,
        'Content-type: text/html;charset=iso-8859-1',
        'MIME-Version: 1.0',
        `In-Reply-To: ${threadId}`,
        `References: ${threadId}`,
        `Subject: Re: ${subject}`,
        '',
        content,
      ].join('\r\n');
    
      const base64EncodedEmail = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
      return base64EncodedEmail;
}

