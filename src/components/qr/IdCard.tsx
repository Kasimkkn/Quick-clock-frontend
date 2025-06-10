
import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { formatDate } from '@/lib/utils';
import { Employee } from '@/types';
import { Download, User } from 'lucide-react';
import { toast } from '../ui/use-toast';

type IdCardProps = {
  employee: Employee;
};

export default function IdCard({ employee }: IdCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQrCode = async () => {
      try {
        // Import QR code generator dynamically
        const QRCode = (await import('qrcode')).default;

        // Generate QR code containing employee ID
        const url = await QRCode.toDataURL(employee.id, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 200,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        setQrCodeUrl(url);
      } catch (error) {
        console.error("Error generating QR code:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate QR code"
        });
      }
    };

    generateQrCode();
  }, [employee.id]);

  const downloadAsPdf = async () => {
    try {
      const jspdf = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      toast({
        title: "Processing",
        description: "Generating PDF, please wait..."
      });

      // Capture the card as an image
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        // Create PDF
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [105, 148] // A6 size
        });

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);

        // Save the PDF
        pdf.save(`${employee.fullName.replace(/\s+/g, '_')}_ID_Card.pdf`);

        toast({
          title: "Success",
          description: "ID card PDF downloaded successfully"
        });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF"
      });
    }
  };

  // Function to handle image errors and set fallback
  const handleImageError = () => {
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="flex flex-col items-center relative w-full">
      <div ref={cardRef} className="id-card w-full">
        <div className="id-card-header">
          <h2 className="font-bold">EMPLOYEE ID CARD</h2>
        </div>

        <div className='flex gap-4 justify-center'>
          <div className="id-card-photo-container rounded-md w-1/2 h-36 border">
            {employee.photoUrl && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}

            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt="Employee"
                className={`id-card-photo ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          {qrCodeUrl ? (
            <div className="flex w-1/2">
              <img src={qrCodeUrl} alt="QR Code" className="id-card-qr w-full h-36 border " />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-32 h-36 border flex items-center justify-center">
                <p className="text-sm text-gray-400">Loading QR code...</p>
              </div>
            </div>
          )}
        </div>
        <div className="id-card-details mt-4">
          <div className="id-card-detail flex items-end gap-2 py-1 border-b">
            <span className="id-card-label text-lg">Name:</span>
            <span className="text-lg">{employee.fullName}</span>
          </div>
          <div className="id-card-detail flex items-end gap-2 py-1 border-b">
            <span className="id-card-label text-lg">Email:</span>
            <span className="id-card-value">{employee.email}</span>
          </div>
          <div className="id-card-detail flex items-end gap-2 py-1 border-b">
            <span className="id-card-label text-lg">Mobile:</span>
            <span className="id-card-value">+91 {employee.mobile}</span>
          </div>
          <div className="id-card-detail flex items-end gap-2 py-1 border-b">
            <span className="id-card-label text-lg">Designation:</span>
            <span className="id-card-value">{employee.designation}</span>
          </div>
          <div className="id-card-detail flex items-end gap-2 py-1 border-b">
            <span className="id-card-label text-lg">Department:</span>
            <span className="id-card-value">{employee.department}</span>
          </div>
          <div className="id-card-detail flex items-end gap-2 py-1">
            <span className="id-card-label text-lg">Issue Date:</span>
            <span className="id-card-value">
              {formatDate(new Date(employee.createdAt))}
            </span>
          </div>
        </div>
        <Button onClick={downloadAsPdf} className="w-full my-3">
          <span>Download</span> <Download />
        </Button>
      </div>

    </div>
  );
}
