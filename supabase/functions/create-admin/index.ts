import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase(
    {
      auth: "user",
    },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return Response.json(
          {
            error: "Method not allowed",
          },
          {
            status: 405,
          }
        );
      }

      try {
        /*
         * المستخدم الذي قام بتسجيل الدخول.
         *
         * withSupabase({ auth: "user" })
         * يتحقق من الـ JWT ويضع بيانات المستخدم
         * داخل ctx.userClaims.
         */
        const currentUser = ctx.userClaims;

        if (!currentUser?.id) {
          return Response.json(
            {
              error: "يجب تسجيل الدخول أولًا.",
            },
            {
              status: 401,
            }
          );
        }

        /*
         * التأكد أن المستخدم الحالي هو Root Admin.
         */
        const { data: currentProfile, error: profileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

        if (
          profileError ||
          !currentProfile ||
          currentProfile.role !== "root_admin"
        ) {
          return Response.json(
            {
              error:
                "غير مسموح. هذه العملية متاحة للـ Root Admin فقط.",
            },
            {
              status: 403,
            }
          );
        }

        /*
         * قراءة البيانات القادمة من الواجهة.
         */
        const body = await req.json();

        const {
          name,
          email,
          password,
          permissions,
        } = body;

        /*
         * التحقق من البيانات الأساسية.
         */
        if (
          typeof name !== "string" ||
          !name.trim() ||
          typeof email !== "string" ||
          !email.trim() ||
          typeof password !== "string" ||
          password.length < 6
        ) {
          return Response.json(
            {
              error:
                "من فضلك أدخل الاسم والبريد الإلكتروني وكلمة مرور لا تقل عن 6 أحرف.",
            },
            {
              status: 400,
            }
          );
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        /*
         * إنشاء حساب المشرف في Supabase Auth.
         *
         * عند إنشاء المستخدم، Trigger:
         *
         * on_auth_user_created
         *
         * يشغل:
         *
         * handle_new_student()
         *
         * والذي يقوم تلقائيًا بإنشاء Profile
         * داخل public.profiles بدور student.
         */
        const {
          data: createdUser,
          error: createUserError,
        } =
          await ctx.supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
          });

        if (createUserError || !createdUser.user) {
          console.error(
            "Create user error:",
            createUserError
          );

          return Response.json(
            {
              error:
                createUserError?.message ||
                "فشل إنشاء حساب المشرف.",
            },
            {
              status: 400,
            }
          );
        }

        const adminId = createdUser.user.id;

        console.log(
          "New admin Auth user created:",
          adminId
        );

        /*
         * مهم:
         *
         * لا نستخدم INSERT هنا.
         *
         * الـ Trigger قام بالفعل بإنشاء Profile
         * لهذا المستخدم.
         *
         * لذلك نقوم بتحويل الـ Profile من student
         * إلى admin وتحديث بياناته.
         */
        const {
          data: updatedProfile,
          error: profileUpdateError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .update({
            full_name: cleanName,
            email: cleanEmail,
            role: "admin",
          })
          .eq("id", adminId)
          .select("id, full_name, email, role")
          .single();

        if (profileUpdateError || !updatedProfile) {
          /*
           * إذا فشل تحديث الـ Profile،
           * نحذف حساب Auth حتى لا نترك
           * حسابًا ناقصًا.
           */
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            adminId
          );

          console.error(
            "Profile update error:",
            profileUpdateError
          );

          return Response.json(
            {
              error:
                "تم إنشاء الحساب ولكن فشل تحديث بيانات المشرف.",
            },
            {
              status: 500,
            }
          );
        }

        /*
         * تجهيز صلاحيات المشرف.
         */
        const permissionRows = [
          {
            section: "announcements",
            enabled:
              permissions?.announcements === true,
          },
          {
            section: "events",
            enabled:
              permissions?.events === true,
          },
          {
            section: "requests",
            enabled:
              permissions?.requests === true,
          },
          {
            section: "resources",
            enabled:
              permissions?.resources === true,
          },
          {
            section: "faculties",
            enabled:
              permissions?.faculties === true,
          },
          {
            section: "students",
            enabled:
              permissions?.students === true,
          },
        ].map((item) => ({
          admin_id: adminId,
          section: item.section,
          can_view: item.enabled,
          can_add: item.enabled,
          can_edit: item.enabled,
          can_delete: item.enabled,
        }));

        /*
         * حفظ الصلاحيات.
         */
        const { error: permissionsError } =
          await ctx.supabaseAdmin
            .from("admin_permissions")
            .insert(permissionRows);

        if (permissionsError) {
          /*
           * تنظيف الـ Profile.
           */
          await ctx.supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", adminId);

          /*
           * تنظيف حساب Auth.
           */
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            adminId
          );

          console.error(
            "Permissions insert error:",
            permissionsError
          );

          return Response.json(
            {
              error:
                "تم إنشاء الحساب ولكن فشل حفظ الصلاحيات.",
            },
            {
              status: 500,
            }
          );
        }

        /*
         * نجاح العملية بالكامل.
         */
        return Response.json(
          {
            success: true,
            message: "تم إنشاء المشرف بنجاح.",
            admin: {
              id: adminId,
              name: cleanName,
              email: cleanEmail,
              role: "admin",
            },
          },
          {
            status: 201,
          }
        );
      } catch (error) {
        console.error(
          "Unexpected create-admin error:",
          error
        );

        return Response.json(
          {
            error: "حدث خطأ غير متوقع.",
          },
          {
            status: 500,
          }
        );
      }
    }
  ),
};