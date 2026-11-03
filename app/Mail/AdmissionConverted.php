<?php

namespace App\Mail;

use App\Models\Admission;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionConverted extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Admission $admission,
        public User $user,
    ) {}

    /**
     * Asunto de bienvenida.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Bienvenido a la UPEL! Tus datos de acceso',
        );
    }

    /**
     * Contenido del correo con las credenciales iniciales.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admissions.converted',
            with: [
                'admission' => $this->admission,
                'user' => $this->user,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
