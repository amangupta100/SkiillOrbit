"use client";

import contact from "@/assests/contact-us-animate.svg";
import Image from "next/image";
import { useState } from "react";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import ButtonLoader from "@/utils/Loader";

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setIsSubmitting(true);

      await API.post("/common/support/createQuery", formData);

      toast.success("Support request submitted successfully");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 mt-16 md:mt-0 bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="">
          <h1 className="text-3xl text-center font-bold bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800  leading-tight  to-neutral-300  text-gray-900 ">
            Contact Support
          </h1>

          <div className="flex flex-col-reverse items-center justify-around lg:flex-row gap-8">
            {/* Form */}
            <div className="lg:w-[45%] w-full border-[1.6px] border-zinc-300 py-3 px-4 mt-7 rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-6 mt-3">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Subject of your issue"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md resize-none"
                    placeholder="Drop a message..."
                    required
                  ></textarea>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-800 cursor-pointer text-white py-2 rounded-md"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      {" "}
                      <ButtonLoader color="white" /> Sending...
                    </div>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>

            {/* Image */}
            <div className="lg:w-1/3 md:w-[50%] w-[78%]">
              <Image
                src={contact}
                alt="Customer support"
                className="w-full h-auto"
                width={500}
                height={600}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
